"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update user when session changes
  useEffect(() => {
    if (session?.user) {
      const mappedUser: User = {
        id: session.user.email || 'unknown',
        name: session.user.name || 'Unknown User',
        email: session.user.email || '',
        picture: session.user.image || undefined,
      };
      setUser(mappedUser);
    } else {
      setUser(null);
    }
  }, [session]);

  // Real Google Sign-In using NextAuth
  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await signIn('google', { 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Google Sign-In failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = (): void => {
    nextAuthSignOut({ callbackUrl: '/' });
  };

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || status === 'loading',
    isAuthenticated: !!session?.user,
    signInWithGoogle,
    signOut,
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
