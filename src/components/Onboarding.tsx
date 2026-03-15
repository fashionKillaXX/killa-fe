"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding, Gender } from "@/contexts/OnboardingContext";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { GenderStep } from "@/components/onboarding/GenderStep";
import { AgeStep } from "@/components/onboarding/AgeStep";
import { BrandsStep } from "@/components/onboarding/BrandsStep";
import { BodyTypeStep } from "@/components/onboarding/BodyTypeStep";
import { AccessoriesStep } from "@/components/onboarding/AccessoriesStep";
import { CompletionStep } from "@/components/onboarding/CompletionStep";

type OnboardingStep =
  | "welcome"
  | "gender"
  | "age"
  | "brands"
  | "bodyType"
  | "accessories"
  | "completion";

export function Onboarding() {
  const router = useRouter();

  const {
    onboardingData,
    updateGender,
    updateAge,
    updateBrands,
    updateBodyType,
    updateAccessories,
    completeOnboarding,
  } = useOnboarding();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");

  const handleClose = () => {
    // When onboarding is skipped/closed, navigate to home
    router.push('/');
  };

  const handleGenderNext = (gender: Gender) => {
    updateGender(gender);
    setCurrentStep("age");
  };

  const handleAgeNext = (age: string) => {
    updateAge(age);
    setCurrentStep("brands");
  };

  const handleBrandsNext = (brands: string[]) => {
    updateBrands(brands);
    setCurrentStep("bodyType");
  };

  const handleBodyTypeNext = (bodyType: string) => {
    updateBodyType(bodyType);
    setCurrentStep("accessories");
  };

  const handleAccessoriesNext = (accessories: string[]) => {
    updateAccessories(accessories);
    setCurrentStep("completion");
  };

  const handleComplete = () => {
    completeOnboarding();
    // Navigate to home after onboarding completes
    router.push('/');
  };

  return (
    <>
      {currentStep === "welcome" && (
        <WelcomeStep onNext={() => setCurrentStep("gender")} onClose={handleClose} />
      )}
      {currentStep === "gender" && (
        <GenderStep
          onNext={handleGenderNext}
          onBack={() => setCurrentStep("welcome")}
          initialValue={onboardingData.gender}
        />
      )}
      {currentStep === "age" && (
        <AgeStep
          onNext={handleAgeNext}
          onBack={() => setCurrentStep("gender")}
          initialValue={onboardingData.age}
        />
      )}
      {currentStep === "brands" && (
        <BrandsStep
          onNext={handleBrandsNext}
          onBack={() => setCurrentStep("age")}
          initialValue={onboardingData.brands}
        />
      )}
      {currentStep === "bodyType" && (
        <BodyTypeStep
          onNext={handleBodyTypeNext}
          onBack={() => setCurrentStep("brands")}
          initialValue={onboardingData.bodyType}
          gender={onboardingData.gender}
        />
      )}
      {currentStep === "accessories" && (
        <AccessoriesStep
          onNext={handleAccessoriesNext}
          onBack={() => setCurrentStep("bodyType")}
          initialValue={onboardingData.accessories}
          gender={onboardingData.gender}
        />
      )}
      {currentStep === "completion" && (
        <CompletionStep onComplete={handleComplete} />
      )}
    </>
  );
}
