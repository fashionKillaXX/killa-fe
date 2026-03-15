"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Gender } from "@/contexts/OnboardingContext";

interface GenderStepProps {
  onNext: (gender: Gender) => void;
  onBack: () => void;
  initialValue: Gender | null;
}

export function GenderStep({ onNext, onBack, initialValue }: GenderStepProps) {
  const [selectedGender, setSelectedGender] = useState<Gender | null>(
    initialValue
  );

  const handleNext = () => {
    if (selectedGender) {
      onNext(selectedGender);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6">
        <button
          onClick={onBack}
          className="p-2 -ml-2 active:bg-gray-100 transition-colors focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <div className="w-12 h-1 bg-black rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-8 py-8">
        <h2 className="mb-3 text-center" style={{ fontSize: "1.75rem" }}>
          How do you identify?
        </h2>
        <p className="text-gray-600 text-center mb-16">
          This helps us personalize your experience
        </p>

        <div className="flex flex-col gap-5 max-w-sm mx-auto w-full">
          {(
            [
              { value: "woman", label: "Woman" },
              { value: "man", label: "Man" },
              { value: "non-binary", label: "Non-binary" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedGender(option.value)}
              className={`py-7 px-8 border transition-all rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] ${selectedGender === option.value
                  ? "border-black bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                }`}
            >
              <span className="uppercase tracking-widest">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="px-8 pb-12 flex justify-center">
        <button
          onClick={handleNext}
          disabled={!selectedGender}
          className={`px-8 py-4 uppercase tracking-widest transition-all rounded-[8px] ${selectedGender
              ? "bg-black text-white hover:bg-black/90"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
