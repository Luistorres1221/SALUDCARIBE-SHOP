import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, type AuthResponse } from "@/api/auth";

export type AppRole =
  | "admin"
  | "medico"
  | "odontologia"
  | "enfermeria"
  | "administrativo"
  | "aseo"
  | "papeleria";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  area: string | null;
  roles: AppRole[];
}

interface AuthCtx {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, area?: string) => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

function storeTokens(res: AuthResponse) {
  localStorage.setItem("accessToken", res.accessToken);
  localStorage.setItem("refreshToken", res.refreshToken);
}

function buildUser(res: AuthResponse): AuthUser {
  return { id: res.userId, email: res.email, fullName: res.fullName, area: res.area, roles: res.roles };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    // Decode JWT payload to restore user without an extra request
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } else {
        // User info lives in localStorage alongside the token
        const stored = localStorage.getItem("authUser");
        if (stored) setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem("accessToken");
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    storeTokens(res);
    const u = buildUser(res);
    localStorage.setItem("authUser", JSON.stringify(u));
    setUser(u);
  };

  const signUp = async (email: string, password: string, fullName: string, area?: string) => {
    const res = await authApi.register({ email, password, fullName, area });
    storeTokens(res);
    const u = buildUser(res);
    localStorage.setItem("authUser", JSON.stringify(u));
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authUser");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, isAdmin: user?.roles.includes("admin") ?? false, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  medico: "Médico",
  odontologia: "Auxiliar de Odontología",
  enfermeria: "Enfermería",
  administrativo: "Administrativo",
  aseo: "Aseo",
  papeleria: "Papelería",
};
