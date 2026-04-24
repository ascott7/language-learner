"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import { DeckPicker } from "./DeckPicker";
import { ProgressBar } from "./ProgressBar";

interface DeckSelectorProps {
  onStartSession: () => void;
}

export function DeckSelector({ onStartSession }: DeckSelectorProps) {
  const deckName = useSessionStore((s) => s.deckName);
  const dueCards = useSessionStore((s) => s.dueCards);
  const setDueCards = useSessionStore((s) => s.setDueCards);
  const targetLevel = useSessionStore((s) => s.targetLevel);

  const [loadingCards, setLoadingCards] = useState(false);
  const [ratedToday, setRatedToday] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckName) return;
    setLoadingCards(true);
    setError(null);

    fetch("/api/anki/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deckName }),
    })
      .then((r) => r.json())
      .then((data: { cards?: import("@/types").AnkiCard[]; totalDue?: number; ratedToday?: number; todayDayNum?: number; error?: string }) => {
        if (data.cards) {
          setDueCards(data.cards, data.todayDayNum);
          setRatedToday(data.ratedToday ?? 0);
        } else {
          setError(data.error ?? "Failed to load cards");
        }
      })
      .catch(() => setError("Failed to load cards"))
      .finally(() => setLoadingCards(false));
  }, [deckName, setDueCards]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      <DeckPicker placeholder="Select a deck…" />

      {deckName && (
        <ProgressBar
          studied={ratedToday}
          total={ratedToday + dueCards.filter((c) => c.type !== 0).length}
          level={targetLevel}
        />
      )}

      <button
        onClick={onStartSession}
        disabled={!deckName || dueCards.length === 0 || loadingCards}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
      >
        {loadingCards
          ? "Loading cards…"
          : dueCards.length === 0 && deckName
          ? "No cards due"
          : "Generate Story"}
      </button>
    </div>
  );
}
