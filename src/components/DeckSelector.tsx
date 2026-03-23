"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import { ProgressBar } from "./ProgressBar";

interface DeckSelectorProps {
  onStartSession: () => void;
}

export function DeckSelector({ onStartSession }: DeckSelectorProps) {
  const deckName = useSessionStore((s) => s.deckName);
  const setDeckName = useSessionStore((s) => s.setDeckName);
  const dueCards = useSessionStore((s) => s.dueCards);
  const setDueCards = useSessionStore((s) => s.setDueCards);
  const targetLevel = useSessionStore((s) => s.targetLevel);

  const [decks, setDecks] = useState<string[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [ratedToday, setRatedToday] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load decks on mount
  useEffect(() => {
    setLoadingDecks(true);
    fetch("/api/anki/decks")
      .then((r) => r.json())
      .then((data: { decks?: string[]; error?: string }) => {
        if (data.decks) setDecks(data.decks);
        else setError(data.error ?? "Failed to load decks");
      })
      .catch(() => setError("Cannot connect to Anki service. Run: docker compose up -d"))
      .finally(() => setLoadingDecks(false));
  }, []);

  // Load cards when deck changes
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Anki deck
        </label>
        <select
          value={deckName ?? ""}
          onChange={(e) => setDeckName(e.target.value)}
          disabled={loadingDecks}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{loadingDecks ? "Loading decks…" : "Select a deck"}</option>
          {decks.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

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
