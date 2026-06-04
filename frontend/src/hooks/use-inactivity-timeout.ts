import { useCallback, useEffect, useRef, useState } from "react";

const WARN_AFTER_MS   = 4 * 60 * 1000 + 30 * 1000; // 4 min 30 seg
const LOGOUT_AFTER_MS = 5 * 60 * 1000;              // 5 min

const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "keydown", "touchstart", "scroll", "click",
] as const;

export function useInactivityTimeout(isLoggedIn: boolean, onLogout: () => void) {
  const [showWarning, setShowWarning] = useState(false);

  const warnTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningVisible = useRef(false); // ref para no crear closures stale en listeners
  const onLogoutRef    = useRef(onLogout);
  onLogoutRef.current  = onLogout;

  const clearTimers = useCallback(() => {
    if (warnTimer.current)   clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    // Si el aviso ya está visible, la actividad no reinicia la sesión:
    // el usuario debe hacer clic explícitamente en "Continuar".
    if (warningVisible.current) return;

    clearTimers();

    warnTimer.current = setTimeout(() => {
      warningVisible.current = true;
      setShowWarning(true);
    }, WARN_AFTER_MS);

    logoutTimer.current = setTimeout(() => {
      warningVisible.current = false;
      setShowWarning(false);
      onLogoutRef.current();
    }, LOGOUT_AFTER_MS);
  }, [clearTimers]);

  const extendSession = useCallback(() => {
    warningVisible.current = false;
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (!isLoggedIn) {
      clearTimers();
      warningVisible.current = false;
      setShowWarning(false);
      return;
    }

    resetTimers();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimers));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [isLoggedIn, resetTimers, clearTimers]);

  return { showWarning, extendSession };
}
