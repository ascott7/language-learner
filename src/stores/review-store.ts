import { create } from "zustand";
import type { AnkiCard, AnkiEase } from "@/types";

interface CardRating {
  cardId: number;
  noteId: number;
  ease: AnkiEase;
  front: string;
  back: string;
}

interface ReviewState {
  queue: AnkiCard[];
  currentIndex: number;
  isFlipped: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  ratings: CardRating[];
  deckName: string | null;
  error: string | null;

  loadQueue: (deckName: string) => Promise<void>;
  flipCard: () => void;
  rateCard: (ease: AnkiEase, front: string, back: string) => Promise<void>;
  reset: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isFlipped: false,
  isLoading: false,
  isSubmitting: false,
  ratings: [],
  deckName: null,
  error: null,

  loadQueue: async (deckName: string) => {
    set({ isLoading: true, error: null, deckName, currentIndex: 0, ratings: [], isFlipped: false });
    try {
      const res = await fetch("/api/anki/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckName }),
      });
      const data = (await res.json()) as { cards?: AnkiCard[]; error?: string };
      if (data.error) throw new Error(data.error);
      set({ queue: data.cards ?? [], isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load cards", isLoading: false });
    }
  },

  flipCard: () => set({ isFlipped: true }),

  rateCard: async (ease: AnkiEase, front: string, back: string) => {
    const { queue, currentIndex } = get();
    const card = queue[currentIndex];
    if (!card) return;

    set({ isSubmitting: true });
    try {
      await fetch("/api/anki/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.cardId, ease }),
      });
      set((s) => ({
        ratings: [...s.ratings, { cardId: card.cardId, noteId: card.noteId, ease, front, back }],
        currentIndex: s.currentIndex + 1,
        isFlipped: false,
        isSubmitting: false,
      }));
    } catch {
      // Still advance even on error
      set((s) => ({
        currentIndex: s.currentIndex + 1,
        isFlipped: false,
        isSubmitting: false,
      }));
    }
  },

  reset: () =>
    set({ queue: [], currentIndex: 0, isFlipped: false, isLoading: false, isSubmitting: false, ratings: [], deckName: null, error: null }),
}));
