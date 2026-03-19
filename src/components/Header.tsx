"use client";

import { GradientDivider } from "@/components/GradientDivider";

export function Header() {
  return (
    <div className="px-6 py-4 md:hidden">
      <div className="flex items-center justify-center">
        <h1 style={{
          fontFamily: "'Cirka', serif",
          fontSize: '1.75rem',
          fontWeight: '900',
          letterSpacing: '-0.02em',
          fontStyle: 'normal',
          textTransform: 'none',
          fontVariant: 'normal'
        }}>
          Fitcurry
        </h1>
      </div>
      <GradientDivider className="mt-4" />
    </div>
  );
}
