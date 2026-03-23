"use client";

import { useEffect, useRef, useState } from "react";
import type { AnkiCard, AnkiEase, StoryWord } from "@/types";
import { cardBack } from "@/types";

const EASE_BUTTONS: { ease: AnkiEase; label: string; selected: string; unselected: string }[] = [
  { ease: 1, label: "Again", selected: "bg-red-400 text-white", unselected: "bg-red-100 hover:bg-red-200 text-red-800" },
  { ease: 2, label: "Hard",  selected: "bg-orange-400 text-white", unselected: "bg-orange-100 hover:bg-orange-200 text-orange-800" },
  { ease: 3, label: "Good",  selected: "bg-green-500 text-white", unselected: "bg-green-100 hover:bg-green-200 text-green-800" },
  { ease: 4, label: "Easy",  selected: "bg-blue-400 text-white", unselected: "bg-blue-100 hover:bg-blue-200 text-blue-800" },
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
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
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

      <div className="grid grid-cols-4 gap-1">
        {EASE_BUTTONS.map(({ ease, label, selected, unselected }) => (
          <button
            key={ease}
            onClick={() => onRate(ease)}
            className={`text-xs py-1 px-1 rounded font-medium transition-colors ${
              rated === ease ? selected : unselected
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface UnknownWordPopoverProps {
  word: StoryWord;
  isLookingUp: boolean;
  isSaving: boolean;
  isAdded: boolean;
  baseForm?: string;
  definition?: string;
  onSave: (front: string, back: string) => void;
  onClose: () => void;
}

export function UnknownWordPopover({
  word,
  isLookingUp,
  isSaving,
  isAdded,
  baseForm,
  definition,
  onSave,
  onClose,
}: UnknownWordPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [editedFront, setEditedFront] = useState(baseForm ?? word.text);
  const [editedBack, setEditedBack] = useState(definition ?? "");

  // Sync editable fields when lookup completes
  useEffect(() => {
    if (baseForm) setEditedFront(baseForm);
  }, [baseForm]);
  useEffect(() => {
    if (definition) setEditedBack(definition);
  }, [definition]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-80 top-full left-1/2 -translate-x-1/2 mt-2"
    >
      <div className="flex justify-between items-start mb-3">
        <p className="font-semibold text-gray-900">{word.text}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {isLookingUp && !baseForm ? (
        <p className="text-sm text-gray-500 mb-3">Looking up definition…</p>
      ) : isAdded ? (
        <p className="text-xs text-green-600 text-center py-2">Added to deck ✓</p>
      ) : (
        <>
          <div className="mb-2">
            <label className="block text-xs text-gray-500 mb-1">Dictionary form</label>
            <input
              type="text"
              value={editedFront}
              onChange={(e) => setEditedFront(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Definition</label>
            <textarea
              value={editedBack}
              onChange={(e) => setEditedBack(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
            />
          </div>
          <button
            onClick={() => onSave(editedFront, editedBack)}
            disabled={isSaving || isLookingUp || !editedFront || !editedBack}
            className="w-full text-sm py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors"
          >
            {isSaving ? "Saving…" : "Add to Anki deck"}
          </button>
        </>
      )}
    </div>
  );
}
