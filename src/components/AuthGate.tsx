"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { LoginScreen } from "@/components/LoginScreen";

/**
 * Auth gate that requires login before showing app content.
 * Allows the OAuth callback page through without auth.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Allow OAuth callback, survey, and the public magazine routes through without auth.
  // The magazine feed (/, /outfit/*, /anchor/*) is open to anonymous browsers;
  // save / save_to_collection actions are gated by BrainSessionContext.requireLogin().
  const publicPathsPrefix = ["/auth/google/callback", "/survey", "/outfit/", "/anchor/"];
  const publicExact = ["/"];
  const isPublicPage =
    publicExact.includes(pathname) ||
    publicPathsPrefix.some((p) => pathname.startsWith(p));

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
