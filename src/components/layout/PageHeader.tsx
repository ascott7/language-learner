"use client";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-8 ${className}`}>
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-900">{title}</h1>
        {subtitle && (
          <p className="text-stone-500 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
}
