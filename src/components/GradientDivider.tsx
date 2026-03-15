"use client";

export function GradientDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-[1px] ${className}`}>
      <div
        className="w-full h-full"
        style={{
          background: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)'
        }}
      />
    </div>
  );
}
