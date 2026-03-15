"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isOnboardingComplete, isLoading: isOnboardingLoading } = useOnboarding();

  useEffect(() => {
    if (!isAuthLoading && !isOnboardingLoading && isAuthenticated && !isOnboardingComplete) {
      if (pathname !== '/onboarding' && pathname !== '/auth/google/callback') {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, isAuthLoading, isOnboardingComplete, isOnboardingLoading, pathname, router]);

  return <>{children}</>;
}
