"use client";

import { useMemo } from "react";
import type { AnkiCard, GeneratedStory } from "@/types";
import { useSessionStore, selectAllWordsRated, selectRatedCount, selectTotalFlashcardWords } from "@/stores/session-store";
import { WordToken } from "./WordToken";
import { TranslationPanel } from "./TranslationPanel";

interface StoryDisplayProps {
  story: GeneratedStory;
  cards: AnkiCard[];
}

export function StoryDisplay({ story, cards }: StoryDisplayProps) {
  const setPhase = useSessionStore((s) => s.setPhase);
  const showTranslation = useSessionStore((s) => s.showTranslation);
  const toggleTranslation = useSessionStore((s) => s.toggleTranslation);
  const ratedCount = useSessionStore(selectRatedCount);
  const totalFlashcardWords = useSessionStore(selectTotalFlashcardWords);
  const allRated = useSessionStore(selectAllWordsRated);

  // Build noteId → AnkiCard map
  const cardByNoteId = useMemo(() => {
    const map = new Map<number, AnkiCard>();
    for (const card of cards) {
      map.set(card.noteId, card);
    }
    return map;
  }, [cards]);

  // Build sentence lookup: for each word, find the sentence it belongs to
  const sentenceFor = useMemo(() => {
    const sentences = story.story.split(/[.!?。！？]\s*/);
    const map = new Map<number, string>();

    for (const word of story.words) {
      let cumLen = 0;
      for (const sentence of sentences) {
        if (word.start >= cumLen && word.start < cumLen + sentence.length + 2) {
          map.set(word.index, sentence);
          break;
        }
        cumLen += sentence.length + 1;
      }
      if (!map.has(word.index)) {
        map.set(word.index, story.story.slice(Math.max(0, word.start - 50), word.end + 50));
      }
    }
    return map;
  }, [story]);

  // Render story as tokens, preserving whitespace between words
  const renderedTokens = useMemo(() => {
    if (story.words.length === 0) return [<span key="empty">{story.story}</span>];

    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const word of story.words) {
      // Preserve whitespace/punctuation before this word
      if (word.start > lastEnd) {
        const gap = story.story.slice(lastEnd, word.start);
        elements.push(<span key={`gap-${lastEnd}`}>{gap}</span>);
      }

      const card = word.flashcardNoteId ? (cardByNoteId.get(word.flashcardNoteId) ?? null) : null;
      const sentence = sentenceFor.get(word.index) ?? story.story;

      elements.push(
        <WordToken
          key={`word-${word.index}`}
          word={word}
          card={card}
          sentence={sentence}
        />,
      );

      lastEnd = word.end;
    }

    // Trailing text after last word
    if (lastEnd < story.story.length) {
      elements.push(
        <span key="trail">{story.story.slice(lastEnd)}</span>,
      );
    }

    return elements;
  }, [story, cardByNoteId, sentenceFor]);

  // Split into paragraphs
  const paragraphTokens = useMemo(() => {
    const paragraphs: React.ReactNode[][] = [];
    let current: React.ReactNode[] = [];

    for (const el of renderedTokens) {
      const text = typeof el === "object" && el !== null && "props" in el
        ? String((el as { props?: { children?: unknown } }).props?.children ?? "")
        : "";

      if (text.includes("\n\n")) {
        const parts = text.split("\n\n");
        current.push(
          <span key={`para-split-${current.length}`}>{parts[0]}</span>,
        );
        paragraphs.push(current);
        current = [<span key={`para-start-${paragraphs.length}`}>{parts[1]}</span>];
      } else {
        current.push(el);
      }
    }
    if (current.length) paragraphs.push(current);
    return paragraphs;
  }, [renderedTokens]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{story.title}</h1>
      <p className="text-xs text-gray-400 mb-6">Grade level: {story.gradeLevel}</p>

      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {ratedCount}/{totalFlashcardWords} words rated
        </p>
        <div className="flex gap-2">
          <button
            onClick={toggleTranslation}
            className="text-sm text-indigo-600 hover:text-indigo-800 underline"
          >
            {showTranslation ? "Hide translation" : "Show translation"}
          </button>
        </div>
      </div>

      {/* Story text */}
      <div className="prose prose-gray max-w-none text-lg leading-relaxed">
        {paragraphTokens.map((para, i) => (
          <p key={i} className="mb-4">
            {para}
          </p>
        ))}
      </div>

      {showTranslation && <TranslationPanel story={story.story} language={story.language} />}

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setPhase("feedback")}
          disabled={!allRated}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
        >
          {allRated ? "Finish" : `Rate all words to continue (${ratedCount}/${totalFlashcardWords})`}
        </button>
      </div>
    </div>
  );
}
