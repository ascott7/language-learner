"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionStore } from "@/stores/session-store";
import { PageHeader } from "@/components/layout";
import { Card, Button, ProgressRing } from "@/components/ui";
import { cardFront, cardBack } from "@/types";
import type { AnkiCard } from "@/types";
import type { GradingResult } from "@/app/api/writing/grade/route";

export default function WritePage() {
  const deckName = useSessionStore((s) => s.deckName);
  const language = useSessionStore((s) => s.language);
  const dueCards = useSessionStore((s) => s.dueCards);

  const [currentCard, setCurrentCard] = useState<AnkiCard | null>(null);
  const [sentence, setSentence] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exerciseCount, setExerciseCount] = useState(0);

  function pickRandomCard(cards: AnkiCard[]) {
    if (cards.length === 0) return null;
    return cards[Math.floor(Math.random() * cards.length)];
  }

  useEffect(() => {
    if (dueCards.length > 0 && !currentCard) {
      setCurrentCard(pickRandomCard(dueCards));
    }
  }, [dueCards, currentCard]);

  async function handleSubmit() {
    if (!sentence.trim() || !currentCard || isGrading) return;
    setIsGrading(true);
    setError(null);

    const promptWord = cardFront(currentCard).replace(/<[^>]+>/g, "").trim();

    try {
      const res = await fetch("/api/writing/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence, promptWord, language }),
      });
      const data = (await res.json()) as GradingResult & { error?: string };
      if (data.error) throw new Error(data.error);
      setResult(data);
      setExerciseCount((c) => c + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed");
    } finally {
      setIsGrading(false);
    }
  }

  function handleNext() {
    setSentence("");
    setResult(null);
    setError(null);
    setCurrentCard(pickRandomCard(dueCards));
  }

  if (!deckName || dueCards.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-stone-500 mb-4">
          {!deckName ? "Select a deck to start writing practice." : "No due cards in this deck."}
        </p>
      </div>
    );
  }

  const promptWord = currentCard ? cardFront(currentCard).replace(/<[^>]+>/g, "").trim() : "";
  const promptMeaning = currentCard ? cardBack(currentCard).replace(/<[^>]+>/g, "").trim() : "";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <PageHeader
        title="Sentence Writing"
        subtitle={`${exerciseCount} sentences written today`}
      />

      {/* Prompt */}
      {currentCard && (
        <Card padding="lg" className="mb-6 border-l-4 border-l-brand-600">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Write a sentence using:</p>
          <p className="font-korean text-3xl font-bold text-stone-900 mb-1">{promptWord}</p>
          <p className="text-stone-500 text-sm">{promptMeaning}</p>
        </Card>
      )}

      {/* Input */}
      {!result && (
        <div className="space-y-4">
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder={`Write a ${language} sentence using "${promptWord}"…`}
            rows={4}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-600 font-korean text-lg resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400">⌘↵ to submit</span>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleNext}>Skip</Button>
              <Button onClick={handleSubmit} disabled={!sentence.trim() || isGrading} loading={isGrading}>
                Grade my sentence
              </Button>
            </div>
          </div>
          {error && <p className="text-rating-again text-sm">{error}</p>}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score card */}
            <Card padding="md">
              <div className="flex items-start gap-6">
                <ProgressRing
                  value={result.score}
                  size={88}
                  strokeWidth={7}
                  color={result.score >= 80 ? "#14B8A6" : result.score >= 60 ? "#0EA5E9" : "#F43F5E"}
                  label={`${result.score}`}
                  sublabel="/100"
                />
                <div className="flex-1">
                  <p className="font-display font-semibold text-stone-900 text-lg mb-1">
                    {result.score >= 90 ? "Excellent!" : result.score >= 80 ? "Great job!" : result.score >= 60 ? "Good effort!" : "Keep practicing!"}
                  </p>
                  {/* Original sentence */}
                  <p className="font-korean text-stone-600 text-sm mb-2">&ldquo;{sentence}&rdquo;</p>
                  {/* Suggested version */}
                  {result.suggestedVersion && result.suggestedVersion !== sentence && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-stone-400 mt-0.5">Better:</span>
                      <p className="font-korean text-stone-700 text-sm">{result.suggestedVersion}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Corrections */}
            {result.corrections.length > 0 && (
              <Card padding="md">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Corrections</p>
                <div className="space-y-3">
                  {result.corrections.map((c, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="line-through text-rating-again font-korean">{c.original}</span>
                        <span className="text-stone-400">→</span>
                        <span className="font-semibold text-accent-teal font-korean">{c.corrected}</span>
                      </div>
                      <p className="text-xs text-stone-500">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Grammar notes */}
            {result.grammarNotes.length > 0 && (
              <Card padding="md">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Grammar Notes</p>
                <ul className="space-y-1.5">
                  {result.grammarNotes.map((note, i) => (
                    <li key={i} className="text-sm text-stone-600 flex gap-2">
                      <span className="text-brand-600 mt-0.5">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Button className="w-full" onClick={handleNext}>
              Next word →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
