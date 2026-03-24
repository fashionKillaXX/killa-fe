"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { SavedCollectionsProvider } from "@/contexts/SavedCollectionsContext";
import { AuthGate } from "@/components/AuthGate";
import { OnboardingGate } from "@/components/OnboardingGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <OnboardingProvider>
          <OnboardingGate>
            <SavedCollectionsProvider>
              {children}
            </SavedCollectionsProvider>
          </OnboardingGate>
        </OnboardingProvider>
      </AuthGate>
    </AuthProvider>
  );
}
