"use client";

import { useState } from "react";
import { useImportStore } from "@/stores/import-store";
import { useSessionStore } from "@/stores/session-store";
import { GrammarBreakdown } from "@/components/grammar/GrammarBreakdown";
import { PageHeader } from "@/components/layout";
import { Card, Button, Skeleton } from "@/components/ui";

const CATEGORY_STYLES = {
  known:       { underline: "border-b-2 border-accent-teal",  bg: "bg-teal-50",  label: "Known" },
  review_soon: { underline: "border-b-2 border-amber-400 border-dashed", bg: "bg-amber-50", label: "Review soon" },
  unknown:     { underline: "border-b border-stone-300",       bg: "bg-stone-50", label: "Unknown" },
  other:       { underline: "",                                bg: "",             label: "" },
};

export default function ImportPage() {
  const deckName = useSessionStore((s) => s.deckName);
  const language = useSessionStore((s) => s.language);
  const { rawText, analysis, isAnalyzing, translation, isTranslating, error, setText, analyze, fetchTranslation, reset } = useImportStore();

  const [grammarSentence, setGrammarSentence] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  function handleAnalyze() {
    analyze(deckName ?? undefined);
  }

  // Reconstruct highlighted text from analysis words
  function renderAnalyzedText() {
    if (!analysis || !rawText) return null;
    const { words } = analysis;

    if (words.length === 0) {
      return <p className="text-stone-600 leading-relaxed font-korean">{rawText}</p>;
    }

    // Reconstruct original text with gaps preserved
    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const word of words) {
      // Gap (whitespace, punctuation)
      if (word.start > lastEnd) {
        elements.push(
          <span key={`gap-${lastEnd}`}>{rawText.slice(lastEnd, word.start)}</span>
        );
      }

      const style = CATEGORY_STYLES[word.category];
      const isInteractive = word.category !== "other";

      elements.push(
        <span
          key={`word-${word.start}`}
          className={`relative inline cursor-pointer rounded-sm transition-colors duration-100 ${style.underline} ${isInteractive && hoveredWord === `${word.start}` ? style.bg : ""}`}
          onMouseEnter={() => isInteractive && setHoveredWord(`${word.start}`)}
          onMouseLeave={() => setHoveredWord(null)}
          onClick={() => {
            if (isInteractive) {
              // Find the sentence containing this word and open grammar panel
              const start = Math.max(0, rawText.lastIndexOf(".", word.start - 1) + 1);
              const end = rawText.indexOf(".", word.end);
              const sentence = rawText.slice(start, end === -1 ? undefined : end + 1).trim();
              setGrammarSentence(sentence);
            }
          }}
        >
          {word.text}
          {isInteractive && hoveredWord === `${word.start}` && word.baseForm && word.baseForm !== word.text && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none font-korean">
              {word.baseForm}
            </span>
          )}
        </span>
      );

      lastEnd = word.end;
    }

    // Trailing text
    if (lastEnd < rawText.length) {
      elements.push(<span key="trail">{rawText.slice(lastEnd)}</span>);
    }

    return (
      <p className="text-lg leading-loose font-korean text-stone-800">
        {elements}
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <PageHeader
        title="Import Text"
        subtitle="Paste any Korean text to see which words you know"
      />

      {/* Input area */}
      {!analysis ? (
        <Card padding="md" className="mb-6">
          <textarea
            value={rawText}
            onChange={(e) => setText(e.target.value)}
            placeholder="한국어 텍스트를 여기에 붙여 넣으세요…&#10;(Paste Korean text here)"
            rows={8}
            className="w-full bg-transparent resize-none text-stone-800 placeholder:text-stone-400 focus:outline-none text-base font-korean leading-relaxed"
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-200">
            <span className="text-xs text-stone-400">
              {rawText.length} chars{deckName ? ` · Deck: ${deckName}` : " · No deck selected"}
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={!rawText.trim() || isAnalyzing}
              loading={isAnalyzing}
            >
              Analyze Text
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-accent-teal" />
              <span className="text-xs text-stone-500">Known ({analysis.knownCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-b-2 border-dashed border-amber-400" />
              <span className="text-xs text-stone-500">Review soon ({analysis.reviewSoonCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-stone-300" />
              <span className="text-xs text-stone-500">Unknown ({analysis.unknownCount})</span>
            </div>
            <button
              onClick={reset}
              className="ml-auto text-xs text-brand-600 hover:text-brand-700 underline"
            >
              New text
            </button>
          </div>

          {/* Analyzed text */}
          <Card padding="lg" className="mb-4 relative">
            {renderAnalyzedText()}
            <p className="text-xs text-stone-400 mt-4">
              Tap a word to analyze its sentence grammar · Hover to see base form
            </p>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => fetchTranslation(language)}
              disabled={isTranslating}
              loading={isTranslating}
            >
              {translation ? "Refresh translation" : "Show translation"}
            </Button>
          </div>

          {/* Translation */}
          {translation && (
            <Card padding="md" className="mt-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Translation</p>
              <p className="text-stone-700 leading-relaxed">{translation}</p>
            </Card>
          )}
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {isAnalyzing && (
        <div className="space-y-3 mt-4">
          <Skeleton height={20} className="w-3/4" />
          <Skeleton height={20} />
          <Skeleton height={20} className="w-5/6" />
        </div>
      )}

      <GrammarBreakdown
        sentence={grammarSentence ?? ""}
        open={grammarSentence !== null}
        onClose={() => setGrammarSentence(null)}
      />
    </div>
  );
}
