"use client";

import { useEffect, useRef } from "react";
import type { AnkiCard, AnkiEase, StoryWord } from "@/types";
import { cardBack } from "@/types";

const EASE_BUTTONS: { ease: AnkiEase; label: string; color: string }[] = [
  { ease: 1, label: "Again", color: "bg-red-100 hover:bg-red-200 text-red-800" },
  { ease: 2, label: "Hard", color: "bg-orange-100 hover:bg-orange-200 text-orange-800" },
  { ease: 3, label: "Good", color: "bg-blue-100 hover:bg-blue-200 text-blue-800" },
  { ease: 4, label: "Easy", color: "bg-green-100 hover:bg-green-200 text-green-800" },
];

interface FlashcardPopoverProps {
  word: StoryWord;
  card: AnkiCard;
  rated: AnkiEase | null;
  onRate: (ease: AnkiEase) => void;
  onClose: () => void;
}

export function FlashcardPopover({
  word,
  card,
  rated,
  onRate,
  onClose,
}: FlashcardPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72 top-full left-1/2 -translate-x-1/2 mt-2"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-gray-900">{word.text}</p>
          {word.baseForm && word.baseForm !== word.text && (
            <p className="text-xs text-gray-500">base: {word.baseForm}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <p className="text-sm text-gray-700 mb-3">{cardBack(card)}</p>

      {rated ? (
        <p className="text-xs text-green-600 text-center">
          Rated: {EASE_BUTTONS.find((b) => b.ease === rated)?.label}
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-1">
          {EASE_BUTTONS.map(({ ease, label, color }) => (
            <button
              key={ease}
              onClick={() => onRate(ease)}
              className={`text-xs py-1 px-1 rounded font-medium transition-colors ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface UnknownWordPopoverProps {
  word: StoryWord;
  isAdding: boolean;
  isAdded: boolean;
  baseForm?: string;
  definition?: string;
  onAdd: () => void;
  onClose: () => void;
}

export function UnknownWordPopover({
  word,
  isAdding,
  isAdded,
  baseForm,
  definition,
  onAdd,
  onClose,
}: UnknownWordPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72 top-full left-1/2 -translate-x-1/2 mt-2"
    >
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-gray-900">{word.text}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {isAdding && !baseForm && (
        <p className="text-sm text-gray-500 mb-2">Looking up definition…</p>
      )}
      {baseForm && (
        <div className="mb-2">
          <p className="text-xs text-gray-500">Dictionary form: {baseForm}</p>
          {definition && (
            <p className="text-sm text-gray-700 mt-1">{definition}</p>
          )}
        </div>
      )}

      {isAdded ? (
        <p className="text-xs text-green-600 text-center">Added to deck ✓</p>
      ) : (
        <button
          onClick={onAdd}
          disabled={isAdding}
          className="w-full text-sm py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors"
        >
          {isAdding ? "Adding…" : "Add to Anki deck"}
        </button>
      )}
    </div>
  );
}
