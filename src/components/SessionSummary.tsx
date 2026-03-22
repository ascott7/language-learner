"use client";

import { useSessionStore, selectRatingBreakdown } from "@/stores/session-store";

interface SessionSummaryProps {
  newLevel: number;
  newWordsAdded: number;
  onStudyMore: () => void;
  onGoHome: () => void;
}

export function SessionSummary({
  newLevel,
  newWordsAdded,
  onStudyMore,
  onGoHome,
}: SessionSummaryProps) {
  const story = useSessionStore((s) => s.story);
  const wordRatings = useSessionStore((s) => s.wordRatings);
  const breakdown = useSessionStore(selectRatingBreakdown);
  const totalRated = Object.keys(wordRatings).length;

  const understood = breakdown.good + breakdown.easy;
  const struggled = breakdown.again + breakdown.hard;

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Session Complete</h2>

      {story && (
        <p className="text-center text-gray-500 text-sm mb-6">&ldquo;{story.title}&rdquo;</p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard label="Words Studied" value={totalRated} color="indigo" />
        <StatCard label="Understood" value={understood} color="green" />
        <StatCard label="Need More Practice" value={struggled} color="orange" />
        <StatCard label="New Words Added" value={newWordsAdded} color="purple" />
      </div>

      {/* Rating breakdown */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Rating Breakdown
        </p>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div><span className="block text-lg font-bold text-red-500">{breakdown.again}</span><span className="text-gray-500">Again</span></div>
          <div><span className="block text-lg font-bold text-orange-500">{breakdown.hard}</span><span className="text-gray-500">Hard</span></div>
          <div><span className="block text-lg font-bold text-blue-500">{breakdown.good}</span><span className="text-gray-500">Good</span></div>
          <div><span className="block text-lg font-bold text-green-500">{breakdown.easy}</span><span className="text-gray-500">Easy</span></div>
        </div>
      </div>

      {/* Level */}
      <div className="text-center mb-8">
        <p className="text-sm text-gray-500">Current level</p>
        <p className="text-3xl font-bold text-indigo-600">{newLevel}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onGoHome}
          className="flex-1 py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition-colors"
        >
          Home
        </button>
        <button
          onClick={onStudyMore}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          Study More
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className={`rounded-xl p-4 ${colorMap[color] ?? ""}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}
