"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Morpheme } from "@/app/api/grammar/route";

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  sky:    { bg: "bg-sky-100",    text: "text-sky-800",    border: "border-sky-200" },
  brand:  { bg: "bg-brand-100",  text: "text-brand-800",  border: "border-brand-200" },
  violet: { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200" },
  amber:  { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200" },
  teal:   { bg: "bg-teal-100",   text: "text-teal-800",   border: "border-teal-200" },
  rose:   { bg: "bg-rose-100",   text: "text-rose-800",   border: "border-rose-200" },
  stone:  { bg: "bg-stone-100",  text: "text-stone-600",  border: "border-stone-200" },
};

function getColors(color: string) {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.stone;
}

interface GrammarBreakdownProps {
  sentence: string;
  open: boolean;
  onClose: () => void;
}

export function GrammarBreakdown({ sentence, open, onClose }: GrammarBreakdownProps) {
  const [morphemes, setMorphemes] = useState<Morpheme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sentence) return;
    setIsLoading(true);
    setError(null);
    setMorphemes([]);

    fetch("/api/grammar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence }),
    })
      .then((r) => r.json())
      .then((data: { morphemes?: Morpheme[]; error?: string }) => {
        if (data.error) setError(data.error);
        else setMorphemes(data.morphemes ?? []);
      })
      .catch(() => setError("Grammar analysis failed"))
      .finally(() => setIsLoading(false));
  }, [open, sentence]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Filter out punctuation and spaces for the morpheme table
  const contentMorphemes = morphemes.filter(
    (m) => !["SF", "SP", "SS", "SE", "SO", "SW", "SB"].includes(m.tag)
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-stone-900/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel — slides up from bottom */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-card-lg max-h-[70vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 flex-shrink-0">
              <h3 className="font-display font-semibold text-stone-900">Grammar Breakdown</h3>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-stone-600 transition-colors p-1.5 rounded-lg hover:bg-stone-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {/* The sentence */}
              <p className="font-korean text-xl text-stone-800 mb-5 leading-relaxed">{sentence}</p>

              {isLoading && (
                <div className="flex items-center gap-3 py-4 text-stone-500">
                  <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </div>
              )}

              {error && (
                <p className="text-rating-again text-sm">{error}</p>
              )}

              {!isLoading && morphemes.length > 0 && (
                <>
                  {/* Morpheme segmentation bar */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {morphemes.map((m, i) => {
                      if (["SF", "SP", "SS", "SE", "SO", "SW", "SB"].includes(m.tag)) {
                        return <span key={i} className="text-stone-400 self-end pb-1">{m.form}</span>;
                      }
                      const c = getColors(m.color);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <span className={`font-korean text-base px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}>
                            {m.form}
                          </span>
                          <span className="text-xs text-stone-400">{m.label_en.split(" ")[0]}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Morpheme detail table */}
                  {contentMorphemes.length > 0 && (
                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-stone-50">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Form</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Dictionary</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Tag</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {contentMorphemes.map((m, i) => {
                            const c = getColors(m.color);
                            return (
                              <tr key={i} className="hover:bg-stone-50 transition-colors">
                                <td className="px-4 py-2.5 font-korean font-medium text-stone-900">{m.form}</td>
                                <td className="px-4 py-2.5 font-korean text-stone-600">{m.base !== m.form ? m.base : "—"}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>{m.tag}</span>
                                </td>
                                <td className="px-4 py-2.5 text-stone-600">{m.label_en}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
