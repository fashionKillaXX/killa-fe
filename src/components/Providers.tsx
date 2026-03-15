"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { SavedCollectionsProvider } from "@/contexts/SavedCollectionsContext";
import { AuthGate } from "@/components/AuthGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <OnboardingProvider>
          <SavedCollectionsProvider>
            {children}
          </SavedCollectionsProvider>
        </OnboardingProvider>
      </AuthGate>
    </AuthProvider>
  );
}
