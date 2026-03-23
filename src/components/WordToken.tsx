"use client";

import { useState } from "react";
import type { AnkiCard, AnkiEase, StoryWord } from "@/types";
import { useSessionStore } from "@/stores/session-store";
import { FlashcardPopover, UnknownWordPopover } from "./WordPopover";

interface WordTokenProps {
  word: StoryWord;
  card: AnkiCard | null; // set when word is a selected flashcard word
  reviewSoonCard: AnkiCard | null; // set when word matches a card due within 7 days
  sentence: string; // surrounding sentence for definition lookup
}

const EASE_CLASSES: Record<AnkiEase, string> = {
  1: "bg-red-100 border-b-2 border-red-400",
  2: "bg-orange-100 border-b-2 border-orange-400",
  3: "bg-green-100 border-b-2 border-green-400",
  4: "bg-blue-100 border-b-2 border-blue-400",
};

export function WordToken({ word, card, reviewSoonCard, sentence }: WordTokenProps) {
  const [open, setOpen] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Local lookup result — not persisted to store until user saves
  const [lookupResult, setLookupResult] = useState<{
    baseForm: string;
    definition: string;
    existingNote: { front: string; back: string } | null;
  } | null>(null);

  const rateWord = useSessionStore((s) => s.rateWord);
  const addNewWord = useSessionStore((s) => s.addNewWord);
  const wordRatings = useSessionStore((s) => s.wordRatings);
  const newWords = useSessionStore((s) => s.newWords);
  const deckName = useSessionStore((s) => s.deckName);
  const language = useSessionStore((s) => s.language);

  const rating = wordRatings[word.index];
  // Only treat as "confirmed new word" when actually saved — not during lookup
  const confirmedEntry = newWords[word.index]?.confirmed ? newWords[word.index] : undefined;
  const isFlashcard = !!card;
  const isReviewSoon = !isFlashcard && !!reviewSoonCard;

  function getClassName(): string {
    const base = "relative inline cursor-pointer rounded px-0.5 transition-colors";

    if (isFlashcard) {
      if (rating) return `${base} ${EASE_CLASSES[rating.ease]}`;
      return `${base} bg-gray-100 border-b-2 border-gray-400 hover:bg-gray-200`;
    }

    if (confirmedEntry) {
      return `${base} font-semibold bg-amber-50 border-b-2 border-amber-400`;
    }

    if (isReviewSoon) {
      const reviewRating = wordRatings[word.index];
      if (reviewRating) return `${base} ${EASE_CLASSES[reviewRating.ease]}`;
      return `${base} border-b-2 border-dashed border-violet-400 hover:bg-violet-50`;
    }

    return `${base} hover:bg-gray-100`;
  }

  function handleClick() {
    setOpen((prev) => !prev);
    if (!isFlashcard && !isReviewSoon && !confirmedEntry && !isLookingUp && !lookupResult) {
      triggerLookup();
    }
  }

  async function triggerLookup() {
    if (!deckName) return;
    setIsLookingUp(true);

    try {
      const res = await fetch("/api/anki/add-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.text, sentence, language, lookupOnly: true }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          baseForm: string;
          definition: string;
          existingNote: { front: string; back: string } | null;
        };
        setLookupResult(data);
      }
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleSaveToAnki(front: string, back: string) {
    if (!deckName || isSaving) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/anki/add-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckName, front, back }),
      });
      if (res.ok) {
        // Only now add to store — this drives the amber highlight
        addNewWord(word.index, {
          wordIndex: word.index,
          surfaceForm: word.text,
          baseForm: front,
          definition: back,
          sentence,
          confirmed: true,
        });
        setOpen(false);
      }
    } catch {
      // Keep popover open on error
    } finally {
      setIsSaving(false);
    }
  }

  function handleRate(ease: AnkiEase) {
    const activeCard = card ?? reviewSoonCard;
    if (!activeCard) return;
    rateWord(word.index, { wordIndex: word.index, noteId: activeCard.noteId, cardId: activeCard.cardId, ease });

    fetch("/api/anki/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: activeCard.cardId, ease }),
    }).catch(console.error);

    setOpen(false);
  }

  return (
    <span className={getClassName()} onClick={handleClick}>
      {word.text}
      {open && (isFlashcard || isReviewSoon) && (card ?? reviewSoonCard) && (
        <FlashcardPopover
          word={word}
          card={(card ?? reviewSoonCard)!}
          rated={rating?.ease ?? null}
          reviewSoon={isReviewSoon}
          onRate={handleRate}
          onClose={() => setOpen(false)}
        />
      )}
      {open && !isFlashcard && !isReviewSoon && (
        <UnknownWordPopover
          word={word}
          isLookingUp={isLookingUp}
          isSaving={isSaving}
          isAdded={!!confirmedEntry}
          baseForm={lookupResult?.baseForm ?? confirmedEntry?.baseForm}
          definition={lookupResult?.definition ?? confirmedEntry?.definition}
          existingNote={lookupResult?.existingNote ?? null}
          onSave={handleSaveToAnki}
          onClose={() => setOpen(false)}
        />
      )}
    </span>
  );
}
