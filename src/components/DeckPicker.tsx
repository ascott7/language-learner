"use client";

import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import { useAppStore } from "@/stores/app-store";

interface DeckPickerProps {
  placeholder?: string;
  className?: string;
}

export function DeckPicker({ placeholder = "Select a deck…", className }: DeckPickerProps) {
  const deckName = useSessionStore((s) => s.deckName);
  const setDeckName = useSessionStore((s) => s.setDeckName);
  const setSelectedDeck = useAppStore((s) => s.setSelectedDeck);

  const [decks, setDecks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/anki/decks")
      .then((r) => r.json())
      .then((d: { decks?: string[]; error?: string }) => {
        setDecks(d.decks ?? []);
        if (d.error) setError(d.error);
      })
      .catch(() => setError("Could not load decks — is Anki service running?"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filtered = query
    ? decks.filter((d) => d.toLowerCase().includes(query.toLowerCase()))
    : decks;

  function handleSelect(deck: string) {
    setDeckName(deck);
    setSelectedDeck(deck);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={wrapperRef} className={`relative${className ? ` ${className}` : ""}`}>
      <div className="relative">
        <input
          type="text"
          value={open ? query : (deckName ?? "")}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-colors"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <p className="px-4 py-3 text-sm text-rating-again">{error}</p>
          )}
          {!loading && !error && filtered.map((deck) => (
            <button
              key={deck}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(deck); }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-all ${
                deck === deckName
                  ? "bg-brand-50 text-brand-600"
                  : "text-stone-800 hover:bg-brand-50"
              }`}
            >
              {deck}
            </button>
          ))}
          {!loading && !error && filtered.length === 0 && (
            <p className="px-4 py-4 text-sm text-stone-400 text-center">No decks found.</p>
          )}
        </div>
      )}
    </div>
  );
}
