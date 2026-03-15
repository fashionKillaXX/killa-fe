"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/services/api";
import { toast } from "sonner";
import { fetchUserPreferences, invalidatePreferencesCache } from "@/services/preferences";

export type Gender = "woman" | "man" | "non-binary";
export type BodyType = string;
export type Accessory = string;

interface OnboardingData {
  gender: Gender | null;
  age: string;
  brands: string[];
  bodyType: BodyType | null;
  accessories: Accessory[];
}

interface OnboardingContextType {
  onboardingData: OnboardingData;
  updateGender: (gender: Gender) => void;
  updateAge: (age: string) => void;
  updateBrands: (brands: string[]) => void;
  updateBodyType: (bodyType: BodyType) => void;
  updateAccessories: (accessories: Accessory[]) => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  cancelOnboarding: () => void;
  loadOnboardingDataFromBackend: () => Promise<void>;
  isOnboardingComplete: boolean;
  isEditMode: boolean;
  isLoading: boolean;
  redirectPath: string | null;
  setRedirectPath: (path: string | null) => void;
  skipOnboarding: () => void;
}

const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  gender: null,
  age: "",
  brands: [],
  bodyType: null,
  accessories: [],
};

// Valid accessories per gender for validation
const VALID_ACCESSORIES: Record<string, string[]> = {
  woman: ["Earrings", "Bracelet", "Necklace", "Hair accessory"],
  man: ["Sunglasses", "Bracelet", "Caps", "Chain", "Rings", "Slingbag"],
  "non-binary": ["Sunglasses", "Bracelet", "Caps", "Chain", "Rings", "Slingbag", "Earrings", "Necklace", "Hair accessory"],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

// Clear ALL stale localStorage data on module load
if (typeof window !== 'undefined') {
  localStorage.removeItem("onboardingData");
  localStorage.removeItem("onboardingComplete");
  localStorage.removeItem("isEditMode");
  console.log("[OnboardingContext] Cleared stale onboarding localStorage data");
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true); // Default to true
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Load onboarding data from backend for authenticated users
  const loadOnboardingDataFromBackend = async () => {
    setIsLoading(true);
    try {
      const response = await fetchUserPreferences(true); // Force refresh

      if (response.success && response.preferences) {
        const prefs = response.preferences;

        // Convert backend format to onboarding format
        const genderMap: Record<string, Gender> = {
          "Woman": "woman",
          "Man": "man",
          "Non-binary": "non-binary"
        };

        setOnboardingData({
          gender: genderMap[prefs.gender] || null,
          age: prefs.age?.toString() || "",
          brands: prefs.brands?.map((b: any) => b.id) || [],
          bodyType: prefs.body_type || null,
          accessories: prefs.accessory_preferences || [],
        });
        setIsOnboardingComplete(true);
      } else {
        // No preferences found - user needs to complete onboarding
        setOnboardingData(DEFAULT_ONBOARDING_DATA);
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      console.error("[OnboardingContext] Failed to load preferences:", error);
      setOnboardingData(DEFAULT_ONBOARDING_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  // Update functions - only update local state during onboarding flow
  // No localStorage, data is sent to backend on completeOnboarding
  const updateGender = (gender: Gender) => {
    setOnboardingData((prev) => ({
      ...prev,
      gender,
      accessories: [] // Reset accessories for new gender
    }));
  };

  const updateAge = (age: string) => {
    setOnboardingData((prev) => ({ ...prev, age }));
  };

  const updateBrands = (brands: string[]) => {
    setOnboardingData((prev) => ({ ...prev, brands }));
  };

  const updateBodyType = (bodyType: BodyType) => {
    setOnboardingData((prev) => ({ ...prev, bodyType }));
  };

  const updateAccessories = (accessories: Accessory[]) => {
    setOnboardingData((prev) => ({ ...prev, accessories }));
  };

  const completeOnboarding = async () => {
    try {
      // Filter accessories to only include valid ones for the selected gender
      const validAccessories = onboardingData.gender
        ? onboardingData.accessories.filter(acc => VALID_ACCESSORIES[onboardingData.gender!]?.includes(acc))
        : [];

      // Send data to backend
      await api.post('/api/onboarding/', {
        gender: onboardingData.gender === "woman" ? "Woman" : onboardingData.gender === "man" ? "Man" : "Non-binary",
        age: onboardingData.age,
        body_type: onboardingData.bodyType,
        brands: onboardingData.brands,
        accessory_preferences: validAccessories
      });

      // Invalidate preferences cache so next fetch gets fresh data
      invalidatePreferencesCache();

      setIsOnboardingComplete(true);
      setIsEditMode(false);
      toast.success("Preferences saved successfully!");
    } catch (error: any) {
      console.error("Failed to save onboarding data:", error);
      const errorMessage = error.response?.data?.error || "Failed to save preferences. Please try again.";
      toast.error(errorMessage);
      // Don't complete onboarding if save failed
    }
  };

  const [backupOnboardingData, setBackupOnboardingData] = useState<OnboardingData | null>(null);

  const skipOnboarding = () => {
    console.log("[OnboardingContext] skipOnboarding called");
    setIsOnboardingComplete(true);
    setIsEditMode(false);
  };

  const restartOnboarding = () => {
    console.log("[OnboardingContext] restartOnboarding called");
    // Save current data as backup before resetting
    setBackupOnboardingData(onboardingData);

    // Reset to fresh defaults for a clean onboarding experience
    setOnboardingData(DEFAULT_ONBOARDING_DATA);
    setIsEditMode(true);
    setIsOnboardingComplete(false);
  };

  const cancelOnboarding = () => {
    console.log("[OnboardingContext] cancelOnboarding called, isEditMode:", isEditMode);
    if (isEditMode) {
      // Restore from backup if available, otherwise fetch
      if (backupOnboardingData) {
        setOnboardingData(backupOnboardingData);
        setBackupOnboardingData(null);
      } else {
        loadOnboardingDataFromBackend();
      }
      setIsOnboardingComplete(true);
      setIsEditMode(false);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        updateGender,
        updateAge,
        updateBrands,
        updateBodyType,
        updateAccessories,
        completeOnboarding,
        restartOnboarding,
        cancelOnboarding,
        loadOnboardingDataFromBackend,
        isOnboardingComplete,
        isEditMode,
        isLoading,
        skipOnboarding,
        redirectPath,
        setRedirectPath,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
