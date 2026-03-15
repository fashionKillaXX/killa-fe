"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { SavedCollectionsProvider } from "@/contexts/SavedCollectionsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <SavedCollectionsProvider>
          {children}
        </SavedCollectionsProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}
