interface ProgressBarProps {
  studied: number;
  total: number;
  level: number;
}

export function ProgressBar({ studied, total, level }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((studied / total) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">
          {studied} / {total} cards studied today
        </span>
        <span className="text-sm font-medium text-indigo-600">
          Level {level}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
