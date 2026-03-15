"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Gender } from "@/contexts/OnboardingContext";

interface BodyTypeStepProps {
  onNext: (bodyType: string) => void;
  onBack: () => void;
  initialValue: string | null;
  gender: Gender | null;
}

const BODY_TYPES = {
  man: [
    { value: "Rectangle", label: "Rectangle", icon: "\u25AD" },
    { value: "Oval", label: "Oval", icon: "\u2B2D" },
    { value: "Triangle", label: "Triangle", icon: "\u25BD" },
    { value: "Trapezoid", label: "Trapezoid", icon: "\u2B20" },
    { value: "Inverted Triangle", label: "Inverted Triangle", icon: "\u25B3" },
  ],
  woman: [
    { value: "Pear", label: "Pear", icon: "\u25BD" },
    { value: "Rectangle", label: "Rectangle", icon: "\u25AD" },
    { value: "Apple", label: "Apple", icon: "\u2B2D" },
    { value: "Hourglass", label: "Hourglass", icon: "\u29D7" },
    { value: "Inverted Triangle", label: "Inverted Triangle", icon: "\u25B3" },
  ],
  "non-binary": [
    { value: "Rectangle", label: "Rectangle", icon: "\u25AD" },
    { value: "Triangle", label: "Triangle", icon: "\u25BD" },
    { value: "Inverted Triangle", label: "Inverted Triangle", icon: "\u25B3" },
    { value: "Oval", label: "Oval", icon: "\u2B2D" },
    { value: "Hourglass", label: "Hourglass", icon: "\u29D7" },
  ],
};

export function BodyTypeStep({
  onNext,
  onBack,
  initialValue,
  gender,
}: BodyTypeStepProps) {
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(
    initialValue
  );

  const bodyTypes = gender ? BODY_TYPES[gender] : [];

  const handleNext = () => {
    if (selectedBodyType) {
      onNext(selectedBodyType);
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
          <div className="w-12 h-1 bg-black rounded-full" />
          <div className="w-12 h-1 bg-black rounded-full" />
          <div className="w-12 h-1 bg-black rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-8 py-8">
        <h2 className="mb-3 text-center" style={{ fontSize: "1.75rem" }}>
          What&apos;s your body type?
        </h2>
        <p className="text-gray-600 text-center mb-16">
          This helps us recommend the perfect fit
        </p>

        {/* Body Types List */}
        <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
          {bodyTypes.map((bodyType) => {
            const isSelected = selectedBodyType === bodyType.value;

            return (
              <button
                key={bodyType.value}
                onClick={() => setSelectedBodyType(bodyType.value)}
                className={`py-6 px-6 border flex items-center gap-4 transition-all rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] ${isSelected
                  ? "border-black bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
              >
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-[8px]">
                  <span className="text-2xl text-gray-700">{bodyType.icon}</span>
                </div>
                <span className="uppercase tracking-widest flex-1 text-left">
                  {bodyType.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue Button */}
      <div className="px-8 pb-12 flex justify-center">
        <button
          onClick={handleNext}
          disabled={!selectedBodyType}
          className={`px-8 py-4 uppercase tracking-widest transition-all rounded-[8px] ${selectedBodyType
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
