import { create } from "zustand";
import type {
  AnkiCard,
  DifficultyFeedback,
  GeneratedStory,
  NewWordEntry,
  SessionPhase,
  WordRating,
} from "@/types";

interface SessionState {
  // Config
  deckName: string | null;
  language: string;
  targetLevel: number;

  // Card data
  dueCards: AnkiCard[];
  selectedCards: AnkiCard[]; // subset used for current story

  // Story
  phase: SessionPhase;
  story: GeneratedStory | null;
  translation: string | null;
  showTranslation: boolean;
  isGenerating: boolean;
  generationError: string | null;

  // Reading interactions
  wordRatings: Record<number, WordRating>; // wordIndex → rating
  newWords: Record<number, NewWordEntry>; // wordIndex → new word entry

  // End-of-session
  difficultyFeedback: DifficultyFeedback | null;

  // Actions
  setDeckName: (name: string) => void;
  setLanguage: (lang: string) => void;
  setTargetLevel: (level: number) => void;
  setDueCards: (cards: AnkiCard[]) => void;
  setSelectedCards: (cards: AnkiCard[]) => void;
  setStory: (story: GeneratedStory) => void;
  setTranslation: (text: string) => void;
  toggleTranslation: () => void;
  setIsGenerating: (v: boolean) => void;
  setGenerationError: (err: string | null) => void;
  rateWord: (wordIndex: number, rating: WordRating) => void;
  addNewWord: (wordIndex: number, entry: NewWordEntry) => void;
  updateNewWord: (wordIndex: number, partial: Partial<NewWordEntry>) => void;
  setDifficultyFeedback: (feedback: DifficultyFeedback) => void;
  setPhase: (phase: SessionPhase) => void;
  reset: () => void;
}

const initialState = {
  deckName: null,
  language: "Korean",
  targetLevel: 3,
  dueCards: [],
  selectedCards: [],
  phase: "deck-select" as SessionPhase,
  story: null,
  translation: null,
  showTranslation: false,
  isGenerating: false,
  generationError: null,
  wordRatings: {},
  newWords: {},
  difficultyFeedback: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setDeckName: (name) => set({ deckName: name }),
  setLanguage: (lang) => set({ language: lang }),
  setTargetLevel: (level) => set({ targetLevel: level }),
  setDueCards: (cards) => set({ dueCards: cards }),
  setSelectedCards: (cards) => set({ selectedCards: cards }),
  setStory: (story) => set({ story, phase: "reading" }),
  setTranslation: (text) => set({ translation: text }),
  toggleTranslation: () =>
    set((state) => ({ showTranslation: !state.showTranslation })),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setGenerationError: (err) => set({ generationError: err }),

  rateWord: (wordIndex, rating) =>
    set((state) => ({
      wordRatings: { ...state.wordRatings, [wordIndex]: rating },
    })),

  addNewWord: (wordIndex, entry) =>
    set((state) => ({
      newWords: { ...state.newWords, [wordIndex]: entry },
    })),

  updateNewWord: (wordIndex, partial) =>
    set((state) => ({
      newWords: {
        ...state.newWords,
        [wordIndex]: { ...state.newWords[wordIndex], ...partial },
      },
    })),

  setDifficultyFeedback: (feedback) => set({ difficultyFeedback: feedback }),
  setPhase: (phase) => set({ phase }),

  reset: () =>
    set({
      ...initialState,
      // Preserve deck/language/level across sessions
    }),
}));

// ─── Derived selectors ────────────────────────────────────────────────────────

export function selectRatedCount(state: SessionState): number {
  return Object.keys(state.wordRatings).length;
}

export function selectTotalFlashcardWords(state: SessionState): number {
  return state.story?.flashcardWordIndices.length ?? 0;
}

export function selectAllWordsRated(state: SessionState): boolean {
  const total = selectTotalFlashcardWords(state);
  return total > 0 && selectRatedCount(state) >= total;
}

export function selectNewWordsCount(state: SessionState): number {
  return Object.values(state.newWords).filter((w) => w.confirmed).length;
}

export function selectRatingBreakdown(state: SessionState): {
  again: number;
  hard: number;
  good: number;
  easy: number;
} {
  const breakdown = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const r of Object.values(state.wordRatings)) {
    if (r.ease === 1) breakdown.again++;
    else if (r.ease === 2) breakdown.hard++;
    else if (r.ease === 3) breakdown.good++;
    else if (r.ease === 4) breakdown.easy++;
  }
  return breakdown;
}
