"use client";

import { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function TextInput({ className = "", ...props }: TextInputProps) {
  return (
    <input
      type="text"
      className={`w-full bg-white border border-gray-200 text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:border-gray-300 transition-colors shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)] rounded-[8px] ${className}`}
      {...props}
    />
  );
}
