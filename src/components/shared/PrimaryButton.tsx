"use client";

import { ButtonHTMLAttributes } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function PrimaryButton({ children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`py-3 px-4 bg-black text-white active:bg-gray-800 hover:bg-gray-800 transition-colors flex items-center justify-center uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.08)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
