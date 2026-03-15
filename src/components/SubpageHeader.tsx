"use client";

import { ArrowLeft } from "lucide-react";
import { GradientDivider } from "@/components/GradientDivider";

interface SubpageHeaderProps {
  onBackClick: () => void;
  showDivider?: boolean;
}

export function SubpageHeader({ onBackClick, showDivider = true }: SubpageHeaderProps) {
  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackClick}
          className="p-2 -ml-2 active:bg-gray-100 transition-colors focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      {showDivider && <GradientDivider className="mt-6" />}
    </div>
  );
}
