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
  todayDayNum: number; // Anki's current day number, for computing due-soon

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

  // Cards reviewed early (persists across reset so same card isn't shown again this session)
  reviewedEarlyCardIds: Set<number>;

  // Actions
  setDeckName: (name: string) => void;
  setLanguage: (lang: string) => void;
  setTargetLevel: (level: number) => void;
  setDueCards: (cards: AnkiCard[], todayDayNum?: number) => void;
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
  markEarlyReviewDone: (cardId: number) => void;
  reset: () => void;
}

const initialState = {
  deckName: null,
  language: "Korean",
  targetLevel: 3,
  dueCards: [],
  selectedCards: [],
  todayDayNum: 0,
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
  // Not in initialState so reset() doesn't clear it — intentionally persists across stories
  reviewedEarlyCardIds: new Set<number>(),

  setDeckName: (name) => set({ deckName: name }),
  setLanguage: (lang) => set({ language: lang }),
  setTargetLevel: (level) => set({ targetLevel: level }),
  setDueCards: (cards, todayDayNum) =>
    set((s) => ({ dueCards: cards, todayDayNum: todayDayNum ?? s.todayDayNum })),
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
  markEarlyReviewDone: (cardId) =>
    set((s) => ({ reviewedEarlyCardIds: new Set([...s.reviewedEarlyCardIds, cardId]) })),

  reset: () =>
    set({
      ...initialState,
      // Preserve deck/language/level across sessions
    }),
}));

// ─── Derived selectors ────────────────────────────────────────────────────────

export function selectRatedCount(state: SessionState): number {
  const flashcardIndices = new Set(state.story?.flashcardWordIndices ?? []);
  return Object.keys(state.wordRatings).filter((i) =>
    flashcardIndices.has(Number(i)),
  ).length;
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

export function selectEarlyReviewCount(state: SessionState): number {
  const flashcardIndices = new Set(state.story?.flashcardWordIndices ?? []);
  return Object.keys(state.wordRatings).filter(
    (i) => !flashcardIndices.has(Number(i)),
  ).length;
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
