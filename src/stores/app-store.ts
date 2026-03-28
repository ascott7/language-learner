import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  selectedDeck: string | null;
  language: string;
  setSelectedDeck: (deck: string | null) => void;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedDeck: null,
      language: "Korean",
      setSelectedDeck: (deck) => set({ selectedDeck: deck }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    { name: "app-store" }
  )
);
