"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isOnboardingComplete, isLoading: isOnboardingLoading, loadOnboardingDataFromBackend } = useOnboarding();
  const hasChecked = useRef(false);

  // Load preferences from backend when user is authenticated
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !hasChecked.current) {
      hasChecked.current = true;
      loadOnboardingDataFromBackend();
    }
  }, [isAuthenticated, isAuthLoading, loadOnboardingDataFromBackend]);

  // Redirect to onboarding if not complete — but never interrupt the public
  // magazine routes (homepage, outfit detail, anchor mode). Browse stays open
  // even while onboarding is pending.
  useEffect(() => {
    if (!isAuthLoading && !isOnboardingLoading && isAuthenticated && !isOnboardingComplete) {
      const skipExact = ['/onboarding', '/auth/google/callback', '/admin', '/'];
      const skipPrefixes = ['/outfit/', '/anchor/'];
      const skip =
        skipExact.includes(pathname) ||
        skipPrefixes.some((p) => pathname.startsWith(p));
      if (!skip) {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, isAuthLoading, isOnboardingComplete, isOnboardingLoading, pathname, router]);

  return <>{children}</>;
}
