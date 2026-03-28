"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout";
import { Card, Button, ProgressRing } from "@/components/ui";

// Compute character-level diff between expected and actual
function computeDiff(expected: string, actual: string): Array<{ char: string; match: boolean }> {
  const result: Array<{ char: string; match: boolean }> = [];
  const maxLen = Math.max(expected.length, actual.length);
  for (let i = 0; i < maxLen; i++) {
    const e = expected[i] ?? "";
    const a = actual[i] ?? "";
    if (e) result.push({ char: e, match: e === a });
  }
  return result;
}

function charAccuracy(expected: string, actual: string): number {
  if (!expected) return 0;
  let matches = 0;
  const len = Math.max(expected.length, actual.length);
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] === expected[i]) matches++;
  }
  return matches / len;
}

interface ExerciseResult {
  original: string;
  userText: string;
  accuracy: number;
}

export default function ListenPage() {
  const [customText, setCustomText] = useState("");
  const [activeText, setActiveText] = useState("");
  const [userText, setUserText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.9);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [hasVoice, setHasVoice] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check for Korean TTS voice
  useEffect(() => {
    function checkVoices() {
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find((v) => v.lang.startsWith("ko"));
      setHasVoice(!!koVoice);
    }
    checkVoices();
    window.speechSynthesis.onvoiceschanged = checkVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = useCallback((text: string) => {
    if (!text || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.startsWith("ko"));
    if (koVoice) utt.voice = koVoice;
    utt.lang = "ko-KR";
    utt.rate = speed;
    utt.onstart = () => setIsPlaying(true);
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [speed]);

  function handlePlay() {
    if (activeText) {
      speak(activeText);
    }
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }

  function handleStartExercise() {
    const text = customText.trim();
    if (!text) return;
    setActiveText(text);
    setUserText("");
    setResult(null);
    speak(text);
  }

  function handleCheck() {
    if (!activeText || !userText.trim()) return;
    const accuracy = charAccuracy(activeText, userText);
    const r: ExerciseResult = { original: activeText, userText, accuracy };
    setResult(r);
    setResults((prev) => [r, ...prev]);
  }

  function handleReveal() {
    setActiveText(activeText); // keep text
    setResult({ original: activeText, userText, accuracy: charAccuracy(activeText, userText) });
  }

  const diff = result ? computeDiff(result.original, result.userText) : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <PageHeader
        title="Listening & Dictation"
        subtitle="Hear Korean text and type what you hear"
      />

      {!hasVoice && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          No Korean TTS voice found on this device. Try installing a Korean voice pack in your system settings, or use macOS / Chrome on desktop.
        </div>
      )}

      {/* Text input */}
      {!activeText ? (
        <Card padding="lg" className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">Enter Korean text to practice</label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="오늘 날씨가 정말 좋네요.&#10;(Enter Korean text here)"
            rows={5}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-600 font-korean resize-none mb-4"
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-stone-500">Speed:</label>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value={0.7}>0.7×</option>
                <option value={0.9}>0.9×</option>
                <option value={1.0}>1.0×</option>
                <option value={1.2}>1.2×</option>
              </select>
            </div>
            <Button
              onClick={handleStartExercise}
              disabled={!customText.trim()}
              className="ml-auto"
            >
              Start
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Audio controls */}
          <Card padding="md">
            <div className="flex items-center gap-4">
              <button
                onClick={isPlaying ? handleStop : handlePlay}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md transition-all ${isPlaying ? "bg-rating-hard scale-95" : "bg-brand-600 hover:bg-brand-700"}`}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-700">Play audio</p>
                <p className="text-xs text-stone-400">Click to listen again · Speed: {speed}×</p>
              </div>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value={0.7}>0.7×</option>
                <option value={0.9}>0.9×</option>
                <option value={1.0}>1.0×</option>
                <option value={1.2}>1.2×</option>
              </select>
            </div>
          </Card>

          {/* Dictation input */}
          {!result && (
            <div className="space-y-3">
              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="듣고 받아쓰세요…"
                rows={4}
                autoFocus
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-600 font-korean text-lg resize-none"
              />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => { window.speechSynthesis.cancel(); setActiveText(""); setUserText(""); }}>
                  Change text
                </Button>
                <Button variant="secondary" onClick={handleReveal}>Reveal</Button>
                <Button onClick={handleCheck} disabled={!userText.trim()} className="ml-auto">
                  Check
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && diff && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card padding="md">
                  <div className="flex items-center gap-6 mb-4">
                    <ProgressRing
                      value={result.accuracy * 100}
                      size={80}
                      color={result.accuracy >= 0.9 ? "#14B8A6" : result.accuracy >= 0.7 ? "#0EA5E9" : "#F43F5E"}
                      label={`${Math.round(result.accuracy * 100)}%`}
                      sublabel="Accuracy"
                    />
                    <div>
                      <p className="font-display font-semibold text-stone-900">
                        {result.accuracy >= 0.95 ? "Perfect!" : result.accuracy >= 0.8 ? "Very good!" : result.accuracy >= 0.6 ? "Good effort!" : "Keep listening!"}
                      </p>
                      <p className="text-sm text-stone-500 mt-0.5">
                        {Math.round(result.accuracy * result.original.length)} / {result.original.length} characters correct
                      </p>
                    </div>
                  </div>

                  {/* Diff display */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Original</p>
                    <p className="font-korean text-lg leading-relaxed">
                      {diff.map((d, i) => (
                        <span
                          key={i}
                          className={d.match ? "text-stone-800" : "bg-rose-100 text-rating-again rounded px-0.5"}
                        >
                          {d.char}
                        </span>
                      ))}
                    </p>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mt-3">Your answer</p>
                    <p className="font-korean text-lg text-stone-600 leading-relaxed">{result.userText || "—"}</p>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => { setUserText(""); setResult(null); speak(activeText); }}>
                    Try again
                  </Button>
                  <Button className="flex-1" onClick={() => { setActiveText(""); setUserText(""); setResult(null); }}>
                    New text
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Session history */}
      {results.length > 1 && (
        <div className="mt-8">
          <p className="text-sm font-semibold text-stone-500 mb-3">This session</p>
          <div className="space-y-2">
            {results.slice(1).map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.accuracy >= 0.9 ? "bg-accent-teal" : r.accuracy >= 0.7 ? "bg-accent-sky" : "bg-rating-again"}`} />
                <p className="font-korean text-sm text-stone-600 flex-1 truncate">{r.original}</p>
                <span className="text-xs text-stone-400">{Math.round(r.accuracy * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
