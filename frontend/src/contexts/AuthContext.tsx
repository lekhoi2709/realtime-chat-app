"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { User, AuthResponse } from "@/types/chat";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        api.setToken(token);
        const response = await api.getCurrentUser();
        setUser(response.user);
        connectSocket(token);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response: AuthResponse = await api.login({ email, password });
    api.setToken(response.token);
    setUser(response.user);
    connectSocket(response.token);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    const response: AuthResponse = await api.register({
      username,
      email,
      password,
    });
    api.setToken(response.token);
    setUser(response.user);
    connectSocket(response.token);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      api.clearToken();
      setUser(null);
      disconnectSocket();
    }
  };

  const updateProfile = async (displayName: string) => {
    const response = await api.updateProfile({ displayName });
    setUser(response.user);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
