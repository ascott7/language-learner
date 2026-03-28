"use client";

import type { AnkiEase } from "@/types";

const BUTTONS: {
  ease: AnkiEase;
  label: string;
  sublabel: string;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    ease: 1,
    label: "Again",
    sublabel: "<1m",
    activeClass: "bg-rating-again text-white border-rating-again",
    inactiveClass: "bg-rose-50 text-rating-again border-rose-200 hover:bg-rose-100",
  },
  {
    ease: 2,
    label: "Hard",
    sublabel: "<10m",
    activeClass: "bg-rating-hard text-white border-rating-hard",
    inactiveClass: "bg-orange-50 text-rating-hard border-orange-200 hover:bg-orange-100",
  },
  {
    ease: 3,
    label: "Good",
    sublabel: "1d",
    activeClass: "bg-rating-good text-white border-rating-good",
    inactiveClass: "bg-sky-50 text-rating-good border-sky-200 hover:bg-sky-100",
  },
  {
    ease: 4,
    label: "Easy",
    sublabel: "4d",
    activeClass: "bg-rating-easy text-white border-rating-easy",
    inactiveClass: "bg-teal-50 text-rating-easy border-teal-200 hover:bg-teal-100",
  },
];

interface RatingButtonsProps {
  selected?: AnkiEase | null;
  disabled?: boolean;
  size?: "sm" | "lg";
  onRate: (ease: AnkiEase) => void;
}

export function RatingButtons({
  selected = null,
  disabled = false,
  size = "lg",
  onRate,
}: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BUTTONS.map(({ ease, label, sublabel, activeClass, inactiveClass }) => (
        <button
          key={ease}
          onClick={() => onRate(ease)}
          disabled={disabled}
          className={`
            flex flex-col items-center border rounded-xl transition-all duration-150
            disabled:opacity-40 disabled:cursor-not-allowed
            ${size === "lg" ? "py-3 px-2" : "py-1.5 px-1.5"}
            ${selected === ease ? activeClass : inactiveClass}
          `}
        >
          <span className={`font-semibold ${size === "lg" ? "text-sm" : "text-xs"}`}>{label}</span>
          {size === "lg" && (
            <span className="text-xs opacity-70 mt-0.5">{sublabel}</span>
          )}
        </button>
      ))}
    </div>
  );
}
