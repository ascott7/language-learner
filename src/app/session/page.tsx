"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useSessionStore, selectRatingBreakdown } from "@/stores/session-store";
import { StoryDisplay } from "@/components/StoryDisplay";
import { StoryFeedback } from "@/components/StoryFeedback";
import { SessionSummary } from "@/components/SessionSummary";
import type { GeneratedStory } from "@/types";

const CARDS_PER_STORY = 10;

export default function SessionPage() {
  const router = useRouter();
  const generateCalledRef = useRef(false);

  const phase = useSessionStore((s) => s.phase);
  const setPhase = useSessionStore((s) => s.setPhase);
  const deckName = useSessionStore((s) => s.deckName);
  const language = useSessionStore((s) => s.language);
  const targetLevel = useSessionStore((s) => s.targetLevel);
  const dueCards = useSessionStore((s) => s.dueCards);
  const selectedCards = useSessionStore((s) => s.selectedCards);
  const setSelectedCards = useSessionStore((s) => s.setSelectedCards);
  const story = useSessionStore((s) => s.story);
  const setStory = useSessionStore((s) => s.setStory);
  const setIsGenerating = useSessionStore((s) => s.setIsGenerating);
  const setGenerationError = useSessionStore((s) => s.setGenerationError);
  const generationError = useSessionStore((s) => s.generationError);
  const difficultyFeedback = useSessionStore((s) => s.difficultyFeedback);
  const newWords = useSessionStore((s) => s.newWords);
  const reset = useSessionStore((s) => s.reset);
  const breakdown = useSessionStore(useShallow(selectRatingBreakdown));

  const [newLevel, setNewLevel] = useState(targetLevel);
  const [submitting, setSubmitting] = useState(false);

  // Redirect to home if no deck selected
  useEffect(() => {
    if (!deckName) {
      router.replace("/");
    }
  }, [deckName, router]);

  // Generate story on mount
  useEffect(() => {
    if (generateCalledRef.current || !deckName || dueCards.length === 0) return;
    generateCalledRef.current = true;

    // Select up to CARDS_PER_STORY cards (prioritise review over new)
    const reviewCards = dueCards.filter((c) => c.type === 2 || c.type === 1);
    const newCardsSlice = dueCards.filter((c) => c.type === 0);
    const selected = [
      ...reviewCards.slice(0, CARDS_PER_STORY),
      ...newCardsSlice.slice(0, Math.max(0, CARDS_PER_STORY - reviewCards.length)),
    ].slice(0, CARDS_PER_STORY);

    setSelectedCards(selected);
    setIsGenerating(true);
    setPhase("generating");

    fetch("/api/story/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cards: selected,
        language,
        level: targetLevel,
      }),
    })
      .then((r) => r.json())
      .then((data: GeneratedStory & { error?: string }) => {
        if (data.error) {
          setGenerationError(data.error);
        } else {
          setStory(data);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Story generation failed";
        setGenerationError(msg);
      })
      .finally(() => setIsGenerating(false));
  }, [
    deckName,
    dueCards,
    language,
    targetLevel,
    setSelectedCards,
    setIsGenerating,
    setPhase,
    setStory,
    setGenerationError,
  ]);

  async function handleFeedbackSubmit() {
    if (!difficultyFeedback || !deckName || !story || submitting) return;
    setSubmitting(true);

    const confirmedNewWords = Object.values(newWords).filter((w) => w.confirmed);

    try {
      // Apply difficulty feedback → level adjustment
      const feedbackRes = await fetch("/api/story/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckName,
          feedback: difficultyFeedback,
          storyGradeLevel: story.gradeLevel,
        }),
      });
      const feedbackData = (await feedbackRes.json()) as { newLevel: number };
      setNewLevel(feedbackData.newLevel);

      // Save session record
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckName,
          language,
          storyTitle: story.title,
          storyText: story.story,
          storyGradeLevel: story.gradeLevel,
          totalFlashcardWords: story.flashcardWordIndices.length,
          ratingBreakdown: breakdown,
          newWordsAdded: confirmedNewWords.length,
          difficultyFeedback,
        }),
      });

      setPhase("summary");
    } finally {
      setSubmitting(false);
    }
  }

  function handleStudyMore() {
    reset();
    router.replace("/");
  }

  function handleGoHome() {
    reset();
    router.replace("/");
  }

  if (!deckName) return null;

  if (phase === "generating") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        {generationError ? (
          <div className="max-w-md text-center">
            <p className="text-red-600 mb-4">{generationError}</p>
            <button
              onClick={handleGoHome}
              className="text-indigo-600 underline"
            >
              Go back
            </button>
          </div>
        ) : (
          <>
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Generating your story…</p>
          </>
        )}
      </div>
    );
  }

  if (phase === "reading" && story) {
    return (
      <main className="min-h-screen bg-white">
        <StoryDisplay story={story} cards={selectedCards} />
      </main>
    );
  }

  if (phase === "feedback") {
    return (
      <main className="min-h-screen bg-white">
        <StoryFeedback onSubmit={handleFeedbackSubmit} />
        {submitting && (
          <div className="fixed inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </main>
    );
  }

  if (phase === "summary") {
    return (
      <main className="min-h-screen bg-white">
        <SessionSummary
          newLevel={newLevel}
          newWordsAdded={Object.values(newWords).filter((w) => w.confirmed).length}
          onStudyMore={handleStudyMore}
          onGoHome={handleGoHome}
        />
      </main>
    );
  }

  return null;
}
