// lib/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  email: string | null;
  userId: string | null;
  name: string | null;
  logout: () => void;
  login: (token: string, email: string, userId: string, name?: string) => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  email: null,
  userId: null,
  name: null,
  logout: () => {},
  login: () => {},
  apiFetch: async () => {
    throw new Error("AuthContext not initialized");
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedEmail = localStorage.getItem("email");
    const storedUserId = localStorage.getItem("userId");
    const storedName = localStorage.getItem("name");

    if (token && storedUserId) {
      setIsAuthenticated(true);
      setEmail(storedEmail);
      setUserId(storedUserId);
      setName(storedName);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = pathname === "/login" || pathname === "/signup";

    if (!isAuthenticated && !isPublicPage) {
      router.push("/login");
    } else if (isAuthenticated && isPublicPage) {
      router.push("/");
    }
  }, [isAuthenticated, loading, pathname, router]);

  const login = (
    token: string,
    userEmail: string,
    id: string,
    userName?: string,
  ) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", userEmail);
    localStorage.setItem("userId", id);
    if (userName) localStorage.setItem("name", userName);

    setIsAuthenticated(true);
    setEmail(userEmail);
    setUserId(id);
    setName(userName || null);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    setIsAuthenticated(false);
    setEmail(null);
    setUserId(null);
    setName(null);
    router.push("/login");
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      logout();
      throw new Error("Unauthorized");
    }

    return response;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
          <span className="text-sm text-slate-400 uppercase tracking-wider">
            Verifying Credentials...
          </span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, email, logout, login, apiFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
