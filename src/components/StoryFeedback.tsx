"use client";

import type { DifficultyFeedback } from "@/types";
import { useSessionStore, selectRatingBreakdown } from "@/stores/session-store";

const OPTIONS: { value: DifficultyFeedback; label: string; emoji: string }[] = [
  { value: "too_easy", label: "Too Easy", emoji: "😴" },
  { value: "about_right", label: "About Right", emoji: "😊" },
  { value: "too_hard", label: "Too Hard", emoji: "😰" },
];

interface StoryFeedbackProps {
  onSubmit: () => void;
}

export function StoryFeedback({ onSubmit }: StoryFeedbackProps) {
  const difficultyFeedback = useSessionStore((s) => s.difficultyFeedback);
  const setDifficultyFeedback = useSessionStore((s) => s.setDifficultyFeedback);
  const breakdown = useSessionStore(selectRatingBreakdown);

  return (
    <div className="max-w-lg mx-auto px-4 py-10 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-1">How was the story?</h2>
      <p className="text-sm text-gray-500 mb-8">
        Your answer helps calibrate future story difficulty.
      </p>

      <div className="flex gap-3 justify-center mb-10">
        {OPTIONS.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => setDifficultyFeedback(value)}
            className={`flex-1 py-4 rounded-xl border-2 transition-colors ${
              difficultyFeedback === value
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-sm font-medium text-gray-700">{label}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-4 text-sm text-gray-500 mb-8">
        <span className="text-red-500">Again: {breakdown.again}</span>
        <span className="text-orange-500">Hard: {breakdown.hard}</span>
        <span className="text-blue-500">Good: {breakdown.good}</span>
        <span className="text-green-500">Easy: {breakdown.easy}</span>
      </div>

      <button
        onClick={onSubmit}
        disabled={!difficultyFeedback}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
