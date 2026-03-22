"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/session-store";

interface TranslationPanelProps {
  story: string;
  language: string;
}

export function TranslationPanel({ story, language }: TranslationPanelProps) {
  const translation = useSessionStore((s) => s.translation);
  const setTranslation = useSessionStore((s) => s.setTranslation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (translation) return; // already fetched
    setLoading(true);
    setError(null);

    fetch("/api/story/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story, sourceLanguage: language }),
    })
      .then((r) => r.json())
      .then((data: { translation?: string; error?: string }) => {
        if (data.translation) setTranslation(data.translation);
        else setError(data.error ?? "Translation failed");
      })
      .catch(() => setError("Translation request failed"))
      .finally(() => setLoading(false));
  }, [story, language, translation, setTranslation]);

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
        English Translation
      </h2>
      {loading && (
        <p className="text-gray-400 text-sm animate-pulse">Translating…</p>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {translation && (
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {translation}
        </p>
      )}
    </div>
  );
}
