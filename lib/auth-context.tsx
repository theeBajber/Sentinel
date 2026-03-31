// lib/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  email: string | null;
  logout: () => void;
  login: (token: string, email: string) => void; // Add this
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  email: null,
  logout: () => {},
  login: () => {}, // Add default
  apiFetch: async () => {
    throw new Error("AuthContext not initialized");
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedEmail = localStorage.getItem("email");

    if (token) {
      setIsAuthenticated(true);
      setEmail(storedEmail);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = pathname === "/login";

    if (!isAuthenticated && !isPublicPage) {
      router.push("/login");
    } else if (isAuthenticated && isPublicPage) {
      router.push("/");
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Add login function
  const login = (token: string, userEmail: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", userEmail);
    setIsAuthenticated(true);
    setEmail(userEmail);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setIsAuthenticated(false);
    setEmail(null);
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
