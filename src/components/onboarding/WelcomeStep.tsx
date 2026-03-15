"use client";

import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SubpageHeader } from "@/components/SubpageHeader";

interface WelcomeStepProps {
  onNext: () => void;
  onClose?: () => void;
}

export function WelcomeStep({ onNext, onClose }: WelcomeStepProps) {
  const handleBack = () => {
    // Always use onClose to exit onboarding and go to profile
    // This avoids any API calls
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* Header */}
      <SubpageHeader onBackClick={handleBack} />

      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
        <h1
          className="mb-6"
          style={{
            fontFamily: "'Cirka', serif",
            fontSize: "2rem",
            fontWeight: "300",
            letterSpacing: "-0.02em",
            fontStyle: "normal",
            textTransform: "none",
            fontVariant: "normal"
          }}
        >
          Fitcurry
        </h1>

        <h2 className="mb-6 max-w-xs" style={{ fontSize: "1.75rem" }}>
          Let&apos;s build your style profile
        </h2>

        <p className="text-gray-600 mb-16 max-w-sm">
          Tell us what you love so we can personalize your feed
        </p>

        <div className="w-64 h-64 rounded-[8px] overflow-hidden shadow-[0px_4px_12px_0px_rgba(14,31,53,0.12)]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1719552979950-f35958f97ebe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3R5bGUlMjB3YXJkcm9iZXxlbnwxfHx8fDE3NjI2ODUyMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Fashion wardrobe"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="px-8 pb-12 flex justify-center">
        <button
          onClick={onNext}
          className="px-8 py-4 bg-black text-white uppercase tracking-widest hover:bg-black/90 transition-colors rounded-[8px]"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
