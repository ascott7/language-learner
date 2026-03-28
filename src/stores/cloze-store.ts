import { create } from "zustand";

export interface ClozeBlank {
  index: number;        // position in blanks array
  wordStart: number;    // char start in passage
  wordEnd: number;      // char end in passage
  answer: string;       // correct answer
  userAnswer: string;
  correct: boolean | null;
  hintsUsed: number;
  hints: string[];      // progressive hints
}

interface ClozeState {
  passage: string;      // original text with blanks filled
  blanks: ClozeBlank[];
  isChecked: boolean;
  score: number | null;
  sourceType: "story" | "import" | "custom";

  setPassage: (passage: string, blanks: ClozeBlank[], sourceType?: ClozeState["sourceType"]) => void;
  setAnswer: (index: number, answer: string) => void;
  revealHint: (index: number) => void;
  check: () => void;
  reset: () => void;
}

function buildHints(word: string): string[] {
  const hints: string[] = [];
  // Hint 1: first character
  hints.push(word[0] + "…");
  // Hint 2: first half
  hints.push(word.slice(0, Math.ceil(word.length / 2)) + "…");
  // Hint 3: all but last character
  if (word.length > 2) hints.push(word.slice(0, -1) + "_");
  return hints;
}

export const useClozeStore = create<ClozeState>((set, get) => ({
  passage: "",
  blanks: [],
  isChecked: false,
  score: null,
  sourceType: "custom",

  setPassage: (passage, blanks, sourceType = "custom") =>
    set({ passage, blanks, isChecked: false, score: null, sourceType }),

  setAnswer: (index, answer) =>
    set((s) => ({
      blanks: s.blanks.map((b) => (b.index === index ? { ...b, userAnswer: answer } : b)),
    })),

  revealHint: (index) =>
    set((s) => ({
      blanks: s.blanks.map((b) => {
        if (b.index !== index) return b;
        const nextHint = b.hintsUsed;
        if (nextHint >= b.hints.length) return b;
        return { ...b, hintsUsed: b.hintsUsed + 1 };
      }),
    })),

  check: () => {
    const { blanks } = get();
    const checked = blanks.map((b) => ({
      ...b,
      correct: b.userAnswer.trim() === b.answer.trim(),
    }));
    const score = checked.filter((b) => b.correct).length / Math.max(1, checked.length);
    set({ blanks: checked, isChecked: true, score });
  },

  reset: () => set({ passage: "", blanks: [], isChecked: false, score: null, sourceType: "custom" }),
}));

export function generateClozeBlanks(text: string, wordsList: string[]): { passage: string; blanks: ClozeBlank[] } {
  const blanks: ClozeBlank[] = [];
  let blankIndex = 0;

  // Find each target word in the text
  for (const word of wordsList) {
    let searchStart = 0;
    const idx = text.indexOf(word, searchStart);
    if (idx === -1) continue;
    searchStart = idx + word.length;

    const hints = buildHints(word);
    blanks.push({
      index: blankIndex++,
      wordStart: idx,
      wordEnd: idx + word.length,
      answer: word,
      userAnswer: "",
      correct: null,
      hintsUsed: 0,
      hints,
    });
  }

  // Sort by position
  blanks.sort((a, b) => a.wordStart - b.wordStart);
  // Re-index
  blanks.forEach((b, i) => { b.index = i; });

  return { passage: text, blanks };
}
