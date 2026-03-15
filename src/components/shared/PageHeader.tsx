"use client";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="pt-2 pb-6">
      <h1 style={{ fontSize: '28px' }}>{title}</h1>
      {subtitle && (
        <p className="text-gray-500 mt-1" style={{ fontSize: '12px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
