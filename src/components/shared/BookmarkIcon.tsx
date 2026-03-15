"use client";

import { Bookmark } from "lucide-react";

interface BookmarkIconProps {
  isSaved: boolean;
  className?: string;
}

/**
 * Bookmark icon that shows saved state
 * Simple component that receives saved state as prop
 */
export function BookmarkIcon({ isSaved, className = "w-4 h-4" }: BookmarkIconProps) {
  return (
    <Bookmark
      className={`${className} ${
        isSaved ? "fill-black text-black" : "text-gray-400"
      }`}
    />
  );
}
