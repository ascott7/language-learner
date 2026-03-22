"use client";

import { useState } from "react";
import type { AnkiCard, AnkiEase, StoryWord } from "@/types";
import { useSessionStore } from "@/stores/session-store";
import { FlashcardPopover, UnknownWordPopover } from "./WordPopover";

interface WordTokenProps {
  word: StoryWord;
  card: AnkiCard | null; // set when word is a flashcard word
  sentence: string; // surrounding sentence for definition lookup
}

const EASE_CLASSES: Record<AnkiEase, string> = {
  1: "bg-red-100 border-b-2 border-red-400",
  2: "bg-orange-100 border-b-2 border-orange-400",
  3: "bg-blue-100 border-b-2 border-blue-400",
  4: "bg-green-100 border-b-2 border-green-400",
};

export function WordToken({ word, card, sentence }: WordTokenProps) {
  const [open, setOpen] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const rateWord = useSessionStore((s) => s.rateWord);
  const addNewWord = useSessionStore((s) => s.addNewWord);
  const updateNewWord = useSessionStore((s) => s.updateNewWord);
  const wordRatings = useSessionStore((s) => s.wordRatings);
  const newWords = useSessionStore((s) => s.newWords);
  const deckName = useSessionStore((s) => s.deckName);
  const language = useSessionStore((s) => s.language);

  const rating = wordRatings[word.index];
  const newWordEntry = newWords[word.index];
  const isFlashcard = !!card;
  const isUnknown = !!newWordEntry;

  function getClassName(): string {
    const base = "relative inline cursor-pointer rounded px-0.5 transition-colors";

    if (isFlashcard) {
      if (rating) {
        return `${base} ${EASE_CLASSES[rating.ease]}`;
      }
      return `${base} bg-indigo-100 border-b-2 border-indigo-300 hover:bg-indigo-200`;
    }

    if (isUnknown) {
      return `${base} bg-red-100 border-b-2 border-red-400`;
    }

    return `${base} hover:bg-gray-100`;
  }

  function handleClick() {
    setOpen((prev) => !prev);

    // For non-flashcard unknown words: trigger lookup on first tap
    if (!isFlashcard && !isUnknown && !isLookingUp) {
      triggerLookup();
    }
  }

  async function triggerLookup() {
    if (!deckName) return;
    setIsLookingUp(true);

    // Register the word as unknown immediately (shows it highlighted)
    addNewWord(word.index, {
      wordIndex: word.index,
      surfaceForm: word.text,
      baseForm: word.text,
      definition: "",
      sentence,
      confirmed: false,
    });

    try {
      const res = await fetch("/api/anki/add-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: word.text,
          sentence,
          language,
          lookupOnly: true,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { baseForm: string; definition: string };
        updateNewWord(word.index, { baseForm: data.baseForm, definition: data.definition });
      }
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleSaveToAnki(front: string, back: string) {
    if (!deckName || !newWordEntry || isSaving) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/anki/add-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckName, front, back }),
      });

      if (res.ok) {
        updateNewWord(word.index, { confirmed: true, baseForm: front, definition: back });
        setOpen(false);
      }
    } catch {
      // Keep popover open on error
    } finally {
      setIsSaving(false);
    }
  }

  function handleRate(ease: AnkiEase) {
    if (!card) return;
    rateWord(word.index, { wordIndex: word.index, noteId: card.noteId, cardId: card.cardId, ease });

    // Submit to Anki immediately
    fetch("/api/anki/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.cardId, ease }),
    }).catch(console.error);

    setOpen(false);
  }

  return (
    <span className={getClassName()} onClick={handleClick}>
      {word.text}
      {open && isFlashcard && card && (
        <FlashcardPopover
          word={word}
          card={card}
          rated={rating?.ease ?? null}
          onRate={handleRate}
          onClose={() => setOpen(false)}
        />
      )}
      {open && !isFlashcard && (
        <UnknownWordPopover
          word={word}
          isLookingUp={isLookingUp}
          isSaving={isSaving}
          isAdded={newWordEntry?.confirmed ?? false}
          baseForm={newWordEntry?.baseForm}
          definition={newWordEntry?.definition}
          onSave={handleSaveToAnki}
          onClose={() => setOpen(false)}
        />
      )}
    </span>
  );
}
