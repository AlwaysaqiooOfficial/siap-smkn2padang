import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getErrorMessage } from "../lib/api";
import type { ApiResponse, AuthUser, LoginResponse } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string, teacherName?: string) => Promise<LoginResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("siap_user");
    const token = localStorage.getItem("siap_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  async function login(identifier: string, password: string, teacherName?: string) {
    const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
      identifier,
      password,
      teacherName,
    });
    const { token, user: loggedInUser } = res.data.data;
    if (!token || !loggedInUser) return res.data.data;
    localStorage.setItem("siap_token", token);
    localStorage.setItem("siap_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return res.data.data;
  }

  function logout() {
    localStorage.removeItem("siap_token");
    localStorage.removeItem("siap_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

export { getErrorMessage };
