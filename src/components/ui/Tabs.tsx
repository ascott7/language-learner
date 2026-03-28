"use client";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex gap-1 p-1 bg-stone-100 rounded-xl ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === tab.id
              ? "bg-white text-brand-600 shadow-card"
              : "text-stone-500 hover:text-stone-700 hover:bg-white/60"
            }
          `}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className={`
              ml-0.5 px-1.5 py-0.5 text-xs rounded-full font-semibold
              ${activeTab === tab.id ? "bg-brand-100 text-brand-700" : "bg-stone-200 text-stone-600"}
            `}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
