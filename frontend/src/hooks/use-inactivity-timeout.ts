import { useCallback, useEffect, useRef, useState } from "react";

const WARN_AFTER_MS   = 4 * 60 * 1000 + 30 * 1000; // 4 min 30 seg
const LOGOUT_AFTER_MS = 5 * 60 * 1000;              // 5 min

const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "keydown", "touchstart", "scroll", "click",
] as const;

const COUNTDOWN_SECS = 30;

export function useInactivityTimeout(isLoggedIn: boolean, onLogout: () => void) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown,   setCountdown]   = useState(COUNTDOWN_SECS);

  const warnTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningVisible = useRef(false);
  const onLogoutRef    = useRef(onLogout);
  onLogoutRef.current  = onLogout;

  const clearTimers = useCallback(() => {
    if (warnTimer.current)      clearTimeout(warnTimer.current);
    if (logoutTimer.current)    clearTimeout(logoutTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECS);
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  }, []);

  const resetTimers = useCallback(() => {
    if (warningVisible.current) return;

    clearTimers();

    warnTimer.current = setTimeout(() => {
      warningVisible.current = true;
      setShowWarning(true);
      startCountdown();
    }, WARN_AFTER_MS);

    logoutTimer.current = setTimeout(() => {
      warningVisible.current = false;
      setShowWarning(false);
      onLogoutRef.current();
    }, LOGOUT_AFTER_MS);
  }, [clearTimers, startCountdown]);

  const extendSession = useCallback(() => {
    warningVisible.current = false;
    setShowWarning(false);
    setCountdown(COUNTDOWN_SECS);
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (!isLoggedIn) {
      clearTimers();
      warningVisible.current = false;
      setShowWarning(false);
      setCountdown(COUNTDOWN_SECS);
      return;
    }

    resetTimers();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimers));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [isLoggedIn, resetTimers, clearTimers]);

  return { showWarning, countdown, extendSession };
}
