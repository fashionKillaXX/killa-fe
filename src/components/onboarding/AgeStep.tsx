"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";

interface AgeStepProps {
  onNext: (age: string) => void;
  onBack: () => void;
  initialValue: string;
}

export function AgeStep({ onNext, onBack, initialValue }: AgeStepProps) {
  const [age, setAge] = useState(initialValue);

  const handleNext = () => {
    if (age.trim()) {
      onNext(age);
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
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-8 py-8">
        <h2 className="mb-3 text-center" style={{ fontSize: "1.75rem" }}>
          How old are you?
        </h2>
        <p className="text-gray-600 text-center mb-16">
          We&apos;ll suggest age-appropriate styles
        </p>

        <div className="max-w-sm mx-auto w-full">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter your age"
            value={age}
            onChange={(e) => {
              // Only allow numbers
              const value = e.target.value.replace(/[^0-9]/g, '');
              setAge(value);
            }}
            className="w-full py-7 px-8 bg-white border border-gray-200 text-black placeholder:text-gray-400 text-center text-xl rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] focus:outline-none focus:border-gray-300"
            autoFocus
          />
        </div>
      </div>

      {/* Continue Button */}
      <div className="px-8 pb-12 flex justify-center">
        <button
          onClick={handleNext}
          disabled={!age.trim()}
          className={`px-8 py-4 uppercase tracking-widest transition-all rounded-[8px] ${age.trim()
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
