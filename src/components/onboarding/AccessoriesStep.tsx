"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Gender } from "@/contexts/OnboardingContext";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface AccessoriesStepProps {
  onNext: (accessories: string[]) => void;
  onBack: () => void;
  initialValue: string[];
  gender: Gender | null;
}

const ACCESSORY_IMAGES: Record<string, string> = {
  "Sunglasses": "https://images.unsplash.com/photo-1759227922040-0ca4d3cbe42e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5nbGFzc2VzJTIwYWNjZXNzb3J5fGVufDF8fHx8MTc2MjY4MTE0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Bracelet": "https://images.unsplash.com/photo-1741071520895-47d81779c11e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFjZWxldCUyMGpld2Vscnl8ZW58MXx8fHwxNzYyNTY5OTExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Caps": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMGNhcHxlbnwxfHx8fDE3NjI2NzIzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Chain": "https://images.unsplash.com/photo-1662434923031-b9bf1b6c10e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwY2hhaW4lMjBuZWNrbGFjZXxlbnwxfHx8fDE3NjI2MTIzOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Rings": "https://images.unsplash.com/photo-1649118499283-1c7ff168a6d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaW5ncyUyMGpld2Vscnl8ZW58MXx8fHwxNzYyNjg1MjE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Slingbag": "https://images.unsplash.com/photo-1640101943679-bc9243ba3b67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbGluZyUyMGJhZyUyMGZhc2hpb258ZW58MXx8fHwxNzYyNjg1MjE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Earrings": "https://images.unsplash.com/photo-1656109801168-699967cf3ba9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXJyaW5ncyUyMGpld2Vscnl8ZW58MXx8fHwxNzYyNTc3ODY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Necklace": "https://images.unsplash.com/photo-1662434923031-b9bf1b6c10e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwY2hhaW4lMjBuZWNrbGFjZXxlbnwxfHx8fDE3NjI2MTIzOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Hair accessory": "https://images.unsplash.com/photo-1601938219471-fb3393955f15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyJTIwYWNjZXNzb3JpZXN8ZW58MXx8fHwxNzYyNjIzMTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

const ACCESSORIES = {
  man: ["Sunglasses", "Bracelet", "Caps", "Chain", "Rings", "Slingbag"],
  woman: ["Earrings", "Bracelet", "Necklace", "Hair accessory"],
  "non-binary": [
    "Sunglasses",
    "Bracelet",
    "Caps",
    "Chain",
    "Rings",
    "Slingbag",
    "Earrings",
    "Necklace",
    "Hair accessory",
  ],
};

export function AccessoriesStep({
  onNext,
  onBack,
  initialValue,
  gender,
}: AccessoriesStepProps) {
  const accessories = gender ? ACCESSORIES[gender] : [];

  // Filter initialValue to only include valid accessories for current gender
  const validInitialValue = initialValue.filter(acc => accessories.includes(acc));

  const [selectedAccessories, setSelectedAccessories] =
    useState<string[]>(validInitialValue);

  const toggleAccessory = (accessory: string) => {
    setSelectedAccessories((prev) => {
      if (prev.includes(accessory)) {
        return prev.filter((a) => a !== accessory);
      } else {
        return [...prev, accessory];
      }
    });
  };

  const handleNext = () => {
    onNext(selectedAccessories);
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
          <div className="w-12 h-1 bg-black rounded-full" />
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-8 py-6 overflow-hidden">
        <h2 className="mb-3 text-center" style={{ fontSize: "1.75rem" }}>
          Accessory preferences
        </h2>
        <p className="text-gray-600 text-center mb-12">
          Select the accessories you love (optional)
        </p>

        {/* Accessories Grid */}
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="grid grid-cols-2 gap-5 max-w-sm mx-auto">
            {accessories.map((accessory) => {
              const isSelected = selectedAccessories.includes(accessory);

              return (
                <button
                  key={accessory}
                  onClick={() => toggleAccessory(accessory)}
                  className={`border flex flex-col items-center justify-center transition-all overflow-hidden rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] ${isSelected
                    ? "border-black bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                >
                  <div className="w-full aspect-square overflow-hidden">
                    <ImageWithFallback
                      src={ACCESSORY_IMAGES[accessory] || ""}
                      alt={accessory}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="py-4 px-3 w-full">
                    <span className="text-xs uppercase tracking-widest text-center block">
                      {accessory}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="px-8 pb-12 flex justify-center">
        <button
          onClick={handleNext}
          className="px-8 py-4 bg-black text-white uppercase tracking-widest hover:bg-black/90 transition-all rounded-[8px]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
