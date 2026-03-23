"use client";

import { useMemo } from "react";
import type { AnkiCard, GeneratedStory } from "@/types";
import { cardFront } from "@/types";
import { useSessionStore, selectAllWordsRated, selectEarlyReviewCount, selectNewWordsCount, selectRatedCount, selectTotalFlashcardWords } from "@/stores/session-store";
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
  const newWordsCount = useSessionStore(selectNewWordsCount);
  const earlyReviewCount = useSessionStore(selectEarlyReviewCount);
  const dueCards = useSessionStore((s) => s.dueCards);
  const todayDayNum = useSessionStore((s) => s.todayDayNum);

  // Build noteId → AnkiCard map
  const cardByNoteId = useMemo(() => {
    const map = new Map<number, AnkiCard>();
    for (const card of cards) {
      map.set(card.noteId, card);
    }
    return map;
  }, [cards]);

  // Build front-text → AnkiCard map for review cards due within 7 days
  // (excludes already-selected flashcard cards)
  const reviewSoonByText = useMemo(() => {
    const selectedNoteIds = new Set(cards.map((c) => c.noteId));
    const map = new Map<string, AnkiCard>();
    for (const card of dueCards) {
      if (selectedNoteIds.has(card.noteId)) continue;
      if (card.type !== 2) continue; // only review cards have meaningful due day nums
      if (todayDayNum > 0 && card.due > todayDayNum + 7) continue;
      const front = cardFront(card).replace(/<[^>]+>/g, "").trim();
      if (front) map.set(front, card);
    }
    return map;
  }, [dueCards, cards, todayDayNum]);

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
    // Only highlight the first occurrence of each flashcard noteId
    const seenNoteIds = new Set<number>();
    const seenReviewSoonTexts = new Set<string>();

    for (const word of story.words) {
      // Preserve whitespace/punctuation before this word
      if (word.start > lastEnd) {
        const gap = story.story.slice(lastEnd, word.start);
        elements.push(<span key={`gap-${lastEnd}`}>{gap}</span>);
      }

      let card: AnkiCard | null = null;
      if (word.flashcardNoteId) {
        const noteId = word.flashcardNoteId;
        if (!seenNoteIds.has(noteId)) {
          seenNoteIds.add(noteId);
          card = cardByNoteId.get(noteId) ?? null;
        }
      }

      // Check for review-soon match (only for non-flashcard words, first occurrence)
      let reviewSoonCard: AnkiCard | null = null;
      if (!card && !seenReviewSoonTexts.has(word.text)) {
        reviewSoonCard = reviewSoonByText.get(word.text) ?? null;
        if (reviewSoonCard) seenReviewSoonTexts.add(word.text);
      }

      const sentence = sentenceFor.get(word.index) ?? story.story;

      elements.push(
        <WordToken
          key={`word-${word.index}`}
          word={word}
          card={card}
          reviewSoonCard={reviewSoonCard}
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
  }, [story, cardByNoteId, sentenceFor, reviewSoonByText]);

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
          {newWordsCount > 0 && (
            <span className="ml-3 text-amber-600">
              +{newWordsCount} new {newWordsCount === 1 ? "word" : "words"}
            </span>
          )}
          {earlyReviewCount > 0 && (
            <span className="ml-3 text-violet-600">
              · {earlyReviewCount} early {earlyReviewCount === 1 ? "review" : "reviews"}
            </span>
          )}
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
          <div key={i} className="mb-4">
            {para}
          </div>
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
