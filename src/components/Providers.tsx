"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { SavedCollectionsProvider } from "@/contexts/SavedCollectionsContext";
import { BrainSessionProvider } from "@/contexts/BrainSessionContext";
import { AuthGate } from "@/components/AuthGate";
import { OnboardingGate } from "@/components/OnboardingGate";
import { StylistDrawerProvider } from "@/components/magazine/StylistDrawerContext";
import StylistDrawer from "@/components/magazine/StylistDrawer";
import LoginGateSheet from "@/components/magazine/LoginGateSheet";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BrainSessionProvider>
        <AuthGate>
          <OnboardingProvider>
            <OnboardingGate>
              <SavedCollectionsProvider>
                <StylistDrawerProvider>
                  {children}
                  <StylistDrawer />
                  <LoginGateSheet />
                </StylistDrawerProvider>
              </SavedCollectionsProvider>
            </OnboardingGate>
          </OnboardingProvider>
        </AuthGate>
      </BrainSessionProvider>
    </AuthProvider>
  );
}
