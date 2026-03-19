"use client";

import { ButtonHTMLAttributes } from "react";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SecondaryButton({ children, className = "", ...props }: SecondaryButtonProps) {
  return (
    <button
      className={`py-3 px-4 bg-gray-50 border border-gray-200 text-black active:bg-gray-100 hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-center uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.08)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
