"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGoogleAuthUrl, getStoredUser, clearAuthTokens, AuthUser } from '@/lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  accessToken?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for stored user on component mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsInitializing(false);
  }, []);

  // Real Google Sign-In using custom OAuth flow
  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log('Starting Google OAuth flow...');
      // Get the OAuth URL from backend
      const authUrl = await getGoogleAuthUrl();
      console.log('Received auth URL:', authUrl);
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      alert(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const signOut = (): void => {
    clearAuthTokens();
    setUser(null);
  };

  const refreshAuth = (): void => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  };

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || isInitializing,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
