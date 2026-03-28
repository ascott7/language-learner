"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClozeStore, generateClozeBlanks } from "@/stores/cloze-store";
import { PageHeader } from "@/components/layout";
import { Card, Button, ProgressRing } from "@/components/ui";

// Demo/manual passage setup
function SetupPanel({ onStart }: { onStart: (text: string, words: string[]) => void }) {
  const [text, setText] = useState("");
  const [wordsInput, setWordsInput] = useState("");

  function handleStart() {
    const words = wordsInput.split(/[,\n]+/).map((w) => w.trim()).filter(Boolean);
    if (text && words.length) {
      onStart(text, words);
    }
  }

  return (
    <Card padding="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Passage text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="한국어 문장을 입력하세요…"
            rows={6}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-600 font-korean resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Words to blank out <span className="text-stone-400 font-normal">(comma or newline separated)</span>
          </label>
          <textarea
            value={wordsInput}
            onChange={(e) => setWordsInput(e.target.value)}
            placeholder="단어1, 단어2, 단어3"
            rows={3}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-600 font-korean resize-none"
          />
        </div>
        <Button
          onClick={handleStart}
          disabled={!text.trim() || !wordsInput.trim()}
          className="w-full"
        >
          Start Exercise
        </Button>
      </div>
    </Card>
  );
}

export default function ClozePage() {
  const { passage, blanks, isChecked, score, setPassage, setAnswer, revealHint, check, reset } = useClozeStore();
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  function handleStart(text: string, words: string[]) {
    const { passage: p, blanks: b } = generateClozeBlanks(text, words);
    setPassage(p, b, "custom");
  }

  // Render passage with inline blank inputs
  function renderPassage() {
    if (blanks.length === 0) return <p className="font-korean text-lg text-stone-800">{passage}</p>;

    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const blank of blanks) {
      // Text before blank
      if (blank.wordStart > lastEnd) {
        elements.push(
          <span key={`text-${lastEnd}`} className="font-korean text-lg text-stone-800">
            {passage.slice(lastEnd, blank.wordStart)}
          </span>
        );
      }

      // Inline input
      const width = Math.max(60, blank.answer.length * 18);
      const statusClass = isChecked
        ? blank.correct
          ? "border-accent-teal bg-teal-50 text-teal-800"
          : "border-rating-again bg-rose-50 text-rating-again"
        : "border-brand-600 bg-white text-stone-900";

      elements.push(
        <span key={`blank-${blank.index}`} className="inline-flex flex-col items-center align-bottom mx-1 gap-0.5">
          <input
            ref={(el) => { if (el) inputRefs.current.set(blank.index, el); }}
            type="text"
            value={blank.userAnswer}
            onChange={(e) => setAnswer(blank.index, e.target.value)}
            disabled={isChecked}
            className={`border-b-2 bg-transparent outline-none text-center font-korean text-lg transition-colors ${statusClass}`}
            style={{ width }}
            placeholder="___"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const next = inputRefs.current.get(blank.index + 1);
                next?.focus();
              }
            }}
          />
          <span className="text-xs text-stone-400">({blank.index + 1})</span>
        </span>
      );

      lastEnd = blank.wordEnd;
    }

    // Trailing text
    if (lastEnd < passage.length) {
      elements.push(
        <span key="trail" className="font-korean text-lg text-stone-800">{passage.slice(lastEnd)}</span>
      );
    }

    return <div className="leading-loose">{elements}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <PageHeader
        title="Fill in the Blank"
        subtitle="Restore the missing words"
        actions={
          passage ? (
            <Button variant="ghost" size="sm" onClick={reset}>New exercise</Button>
          ) : null
        }
      />

      {!passage ? (
        <SetupPanel onStart={handleStart} />
      ) : (
        <div className="space-y-6">
          {/* Passage */}
          <Card padding="lg">
            {renderPassage()}
          </Card>

          {/* Hints panel */}
          {!isChecked && (
            <Card padding="md">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Hints</p>
              <div className="flex flex-wrap gap-2">
                {blanks.map((blank) => (
                  <div key={blank.index} className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-500">({blank.index + 1})</span>
                    {blank.hintsUsed < blank.hints.length ? (
                      <>
                        {blank.hintsUsed > 0 && (
                          <span className="text-sm font-korean text-stone-600">{blank.hints[blank.hintsUsed - 1]}</span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => revealHint(blank.index)}>
                          {blank.hintsUsed === 0 ? "Hint" : "More"}
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm font-korean text-amber-600">{blank.hints[blank.hints.length - 1]}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Check / Results */}
          {!isChecked ? (
            <Button
              className="w-full"
              onClick={check}
              disabled={blanks.some((b) => !b.userAnswer.trim())}
            >
              Check Answers
            </Button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card padding="md">
                  <div className="flex items-center gap-6">
                    <ProgressRing
                      value={(score ?? 0) * 100}
                      size={80}
                      color={score === 1 ? "#14B8A6" : score && score >= 0.6 ? "#0EA5E9" : "#F43F5E"}
                      label={`${Math.round((score ?? 0) * 100)}%`}
                      sublabel="Score"
                    />
                    <div>
                      <p className="font-display font-semibold text-stone-900 text-lg">
                        {score === 1 ? "Perfect!" : score && score >= 0.8 ? "Great job!" : score && score >= 0.6 ? "Good effort!" : "Keep practicing!"}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">
                        {blanks.filter((b) => b.correct).length} / {blanks.length} correct
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Corrections */}
                {blanks.some((b) => !b.correct) && (
                  <Card padding="md">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Corrections</p>
                    <div className="space-y-2">
                      {blanks.filter((b) => !b.correct).map((b) => (
                        <div key={b.index} className="flex items-center gap-3 text-sm">
                          <span className="text-stone-400">({b.index + 1})</span>
                          <span className="line-through text-rating-again font-korean">{b.userAnswer || "—"}</span>
                          <span className="text-stone-400">→</span>
                          <span className="font-semibold text-accent-teal font-korean">{b.answer}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={reset}>New exercise</Button>
                  <Button className="flex-1" onClick={() => {
                    // Reset answers but keep same passage
                    const freshBlanks = blanks.map((b) => ({
                      ...b, userAnswer: "", correct: null, hintsUsed: 0,
                    }));
                    setPassage(passage, freshBlanks, "custom");
                  }}>
                    Try again
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
