// ─── Anki Card Types ──────────────────────────────────────────────────────────

export interface AnkiCardField {
  value: string;
  order: number;
}

export interface AnkiCard {
  cardId: number;
  noteId: number;
  deckName: string;
  fields: Record<string, AnkiCardField>;
  interval: number; // days
  ease: number; // e.g. 2500 = 250%
  type: 0 | 1 | 2 | 3; // 0=new, 1=learning, 2=review, 3=relearning
  due: number;
  reps: number;
  lapses: number;
}

// Convenience accessors — field names vary per note type
export function cardFront(card: AnkiCard): string {
  const field =
    card.fields["Front"] ??
    card.fields["Word"] ??
    card.fields["Expression"] ??
    Object.values(card.fields)[0];
  return field?.value ?? "";
}

export function cardBack(card: AnkiCard): string {
  const field =
    card.fields["Back"] ??
    card.fields["Meaning"] ??
    card.fields["Definition"] ??
    Object.values(card.fields)[1];
  return field?.value ?? "";
}

// ─── Story Types ──────────────────────────────────────────────────────────────

export interface StoryWord {
  index: number; // position in the words array
  text: string; // exact text as it appears in the story
  start: number; // character offset in the story string
  end: number; // character end offset
  flashcardNoteId: number | null; // noteId if this is a flashcard word
  baseForm: string | null; // dictionary form if different from text
}

export interface GeneratedStory {
  title: string;
  story: string; // plain text of the story
  language: string;
  gradeLevel: number; // 1–12 as rated by Claude
  words: StoryWord[]; // every token with position info
  flashcardWordIndices: number[]; // indices into words[] that are flashcard words
}

// ─── Session Types ────────────────────────────────────────────────────────────

export type SessionPhase =
  | "deck-select"
  | "generating"
  | "reading"
  | "feedback"
  | "summary";

export type AnkiEase = 1 | 2 | 3 | 4; // Again / Hard / Good / Easy

export interface WordRating {
  wordIndex: number;
  noteId: number;
  cardId: number;
  ease: AnkiEase;
}

export type DifficultyFeedback = "too_easy" | "about_right" | "too_hard";

export interface NewWordEntry {
  wordIndex: number;
  surfaceForm: string;
  baseForm: string;
  definition: string;
  sentence: string;
  confirmed: boolean; // user confirmed to add to Anki
}

// ─── Progress / DB Types ──────────────────────────────────────────────────────

export interface SessionRecord {
  id: number;
  deckName: string;
  language: string;
  createdAt: string;
  storyTitle: string;
  storyGradeLevel: number;
  totalFlashcardWords: number;
  ratingBreakdown: { again: number; hard: number; good: number; easy: number };
  newWordsAdded: number;
  difficultyFeedback: DifficultyFeedback | null;
}

export interface SessionDetail extends SessionRecord {
  storyText: string;
  storyWords: StoryWord[] | null;
  flashcardWordIndices: number[] | null;
  wordRatings: WordRating[] | null;
  newWords: NewWordEntry[] | null;
}

export interface LevelHistoryEntry {
  id: number;
  deckName: string;
  level: number;
  changedAt: string;
  reason: string;
}

// ─── API Request / Response Types ────────────────────────────────────────────

export interface GenerateStoryRequest {
  cards: AnkiCard[];
  language: string;
  level: number;
}

export interface TranslateRequest {
  story: string;
  sourceLanguage: string;
}

export interface AnswerCardRequest {
  cardId: number;
  ease: AnkiEase;
}

export interface AddNoteRequest {
  deckName: string;
  word: string;
  sentence: string;
  language: string;
}

export interface AddNoteResponse {
  noteId: number;
  baseForm: string;
  definition: string;
}

export interface AppSettings {
  ankiDbPath: string;
  language: string;
  currentLevel: Record<string, number>; // deckName → level
}
