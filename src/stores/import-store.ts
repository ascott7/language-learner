import { create } from "zustand";
import type { AnalyzedWord, ImportAnalysisResult } from "@/app/api/import/route";

interface ImportState {
  rawText: string;
  analysis: ImportAnalysisResult | null;
  isAnalyzing: boolean;
  translation: string | null;
  isTranslating: boolean;
  error: string | null;

  setText: (text: string) => void;
  analyze: (deckName?: string) => Promise<void>;
  fetchTranslation: (language: string) => Promise<void>;
  reset: () => void;
}

export const useImportStore = create<ImportState>((set, get) => ({
  rawText: "",
  analysis: null,
  isAnalyzing: false,
  translation: null,
  isTranslating: false,
  error: null,

  setText: (text) => set({ rawText: text, analysis: null, translation: null, error: null }),

  analyze: async (deckName?: string) => {
    const { rawText } = get();
    if (!rawText.trim()) return;
    set({ isAnalyzing: true, error: null, analysis: null });
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, deckName }),
      });
      const data = (await res.json()) as ImportAnalysisResult & { error?: string };
      if (data.error) throw new Error(data.error);
      set({ analysis: data, isAnalyzing: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Analysis failed", isAnalyzing: false });
    }
  },

  fetchTranslation: async (language: string) => {
    const { rawText } = get();
    if (!rawText.trim()) return;
    set({ isTranslating: true });
    try {
      const res = await fetch("/api/story/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: rawText, sourceLanguage: language }),
      });
      const data = (await res.json()) as { translation?: string };
      set({ translation: data.translation ?? null, isTranslating: false });
    } catch {
      set({ isTranslating: false });
    }
  },

  reset: () => set({ rawText: "", analysis: null, isAnalyzing: false, translation: null, isTranslating: false, error: null }),
}));

export type { AnalyzedWord };
