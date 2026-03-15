"use client";

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageSection({ children, className = "" }: PageSectionProps) {
  return (
    <div className={`py-6 ${className}`}>
      {children}
    </div>
  );
}
