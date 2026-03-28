"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useReviewStore } from "@/stores/review-store";
import { useSessionStore } from "@/stores/session-store";
import { RatingButtons } from "@/components/review/RatingButtons";
import { PageHeader } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import { cardFront, cardBack } from "@/types";
import type { AnkiEase } from "@/types";

export default function ReviewPage() {
  const router = useRouter();
  const { queue, currentIndex, isFlipped, isLoading, isSubmitting, ratings, error, loadQueue, flipCard, rateCard, reset } = useReviewStore();
  const deckName = useSessionStore((s) => s.deckName);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !deckName) return;
    loadedRef.current = true;
    loadQueue(deckName);
  }, [deckName, loadQueue]);

  const card = queue[currentIndex];
  const total = queue.length;
  const done = currentIndex;
  const isDone = done >= total && total > 0;
  const progress = total > 0 ? (done / total) * 100 : 0;

  // Keyboard shortcuts
  useEffect(() => {
    if (!isFlipped) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          flipCard();
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    } else {
      const handler = (e: KeyboardEvent) => {
        const map: Record<string, AnkiEase> = { "1": 1, "2": 2, "3": 3, "4": 4 };
        const ease = map[e.key];
        if (ease && card && !isSubmitting) {
          rateCard(ease, cardFront(card), cardBack(card));
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [isFlipped, card, isSubmitting, flipCard, rateCard]);

  if (!deckName) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <p className="text-stone-500 mb-4">Please select a deck first.</p>
        <Button onClick={() => router.push("/stories")}>Go to Deck Selector</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-500">Loading your cards…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <p className="text-rating-again mb-4">{error}</p>
        <Button onClick={() => { loadedRef.current = false; loadQueue(deckName); }}>Retry</Button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">All caught up!</h2>
        <p className="text-stone-500 mb-6">No cards due in <strong>{deckName}</strong> right now.</p>
        <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  if (isDone) {
    const breakdown = ratings.reduce(
      (acc, r) => { acc[r.ease] = (acc[r.ease] || 0) + 1; return acc; },
      {} as Record<number, number>
    );
    return (
      <div className="max-w-md mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-display font-bold text-stone-900 mb-1">Session complete!</h2>
          <p className="text-stone-500">You reviewed {ratings.length} cards</p>
        </div>
        <Card padding="md" className="mb-6">
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { ease: 1, label: "Again", color: "text-rating-again" },
              { ease: 2, label: "Hard", color: "text-rating-hard" },
              { ease: 3, label: "Good", color: "text-rating-good" },
              { ease: 4, label: "Easy", color: "text-rating-easy" },
            ].map(({ ease, label, color }) => (
              <div key={ease}>
                <p className={`text-2xl font-bold ${color}`}>{breakdown[ease] ?? 0}</p>
                <p className="text-xs text-stone-400">{label}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => { reset(); loadedRef.current = false; loadQueue(deckName); }}>
            Review Again
          </Button>
          <Button className="flex-1" onClick={() => router.push("/")}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const front = cardFront(card).replace(/<[^>]+>/g, "").trim();
  const back = cardBack(card).replace(/<[^>]+>/g, "").trim();

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <PageHeader
        title="Flashcard Review"
        subtitle={deckName}
        actions={
          <span className="text-sm text-stone-400 font-medium">{done + 1} / {total}</span>
        }
      />

      {/* Progress bar */}
      <div className="w-full h-2 bg-stone-200 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-600 to-accent-teal rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Card */}
      <div
        className="relative cursor-pointer mb-6"
        onClick={() => { if (!isFlipped) flipCard(); }}
        style={{ perspective: 1000 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`card-${currentIndex}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            <Card
              variant="elevated"
              padding="lg"
              className="min-h-[260px] flex flex-col items-center justify-center text-center select-none"
            >
              {/* Front */}
              <p className="font-korean text-4xl font-semibold text-stone-900 mb-2">{front}</p>

              {/* Back (shown after flip) */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="mt-4 pt-4 border-t border-stone-200 w-full"
                  >
                    <p className="text-stone-700 text-lg">{back}</p>
                    {card.interval !== undefined && (
                      <p className="text-xs text-stone-400 mt-3">
                        Interval: {card.interval}d · Ease: {(card.ease / 1000).toFixed(1)}x
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!isFlipped && (
                <p className="text-xs text-stone-400 mt-6">Tap to reveal · Space / Enter</p>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs text-stone-400 text-center mb-3">Rate your recall · Keys 1–4</p>
            <RatingButtons
              disabled={isSubmitting}
              onRate={(ease) => rateCard(ease, front, back)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
