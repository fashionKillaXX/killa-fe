"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/services/api";
import { invalidatePreferencesCache } from "@/services/preferences";
import { invalidateCollectionCache, invalidateFeaturedCache } from "@/services/products";

interface User {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  is_new_user?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleGoogleCallback: (code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setIsLoading(false);
  }, []);

  // Listen for forced logout from API interceptor (expired token)
  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = async (email: string, name?: string) => {
    try {
      const response = await api.post('/auth/email/', {
        email,
        name: name || email.split('@')[0]
      });

      if (response.data.success) {
        const { access_token, user: userData } = response.data;

        setToken(access_token);
        setUser(userData);

        // Save to localStorage
        localStorage.setItem("auth_token", access_token);
        localStorage.setItem("auth_user", JSON.stringify(userData));
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Failed to authenticate');
    }
  };

  const loginWithGoogle = async () => {
    try {
      const response = await api.get('/auth/google/authorize/');
      if (response.data.success) {
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error(response.data.error || 'Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.response?.data?.error || 'Failed to initiate Google login');
    }
  };

  const handleGoogleCallback = async (code: string) => {
    try {
      const response = await api.post('/auth/google/callback/', { code });

      if (response.data.success) {
        const { access_token, user: userData } = response.data;

        setToken(access_token);
        setUser(userData);

        // Save to localStorage
        localStorage.setItem("auth_token", access_token);
        localStorage.setItem("auth_user", JSON.stringify(userData));
      } else {
        throw new Error(response.data.error || 'Google login failed');
      }
    } catch (error: any) {
      console.error('Google callback error:', error);
      throw new Error(error.response?.data?.error || 'Failed to complete Google login');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    // Clear all user-specific caches
    invalidatePreferencesCache();
    invalidateCollectionCache();
    invalidateFeaturedCache();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginWithGoogle,
        handleGoogleCallback,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
