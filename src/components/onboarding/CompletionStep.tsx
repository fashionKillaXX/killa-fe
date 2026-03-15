"use client";

import { useEffect, useState } from "react";

interface CompletionStepProps {
  onComplete: () => void;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="mb-12">
          <svg
            className="w-28 h-28 text-black animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="mb-6" style={{ fontSize: "1.75rem" }}>
          Building your personalized fashion feed
        </h2>

        <p className="text-gray-600 mb-16 max-w-sm">
          Curating the perfect styles just for you...
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-1.5 bg-gray-200 overflow-hidden rounded-full">
            <div
              className="h-full bg-black transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-4 text-center tracking-wider">
            {progress}% Complete
          </p>
        </div>
      </div>
    </div>
  );
}
