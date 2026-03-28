import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckName: text("deck_name").notNull(),
  language: text("language").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  storyTitle: text("story_title").notNull(),
  storyText: text("story_text").notNull(),
  storyGradeLevel: real("story_grade_level").notNull(),
  totalFlashcardWords: integer("total_flashcard_words").notNull(),
  // JSON: { again: number; hard: number; good: number; easy: number }
  ratingBreakdown: text("rating_breakdown").notNull().default('{"again":0,"hard":0,"good":0,"easy":0}'),
  newWordsAdded: integer("new_words_added").notNull().default(0),
  difficultyFeedback: text("difficulty_feedback"), // 'too_easy' | 'about_right' | 'too_hard' | null
  // JSON: StoryWord[] — token positions for reconstructing highlighted story
  storyWords: text("story_words"),
  // JSON: number[] — indices into storyWords that are flashcard words
  flashcardWordIndices: text("flashcard_word_indices"),
  // JSON: WordRating[] — per-word ratings submitted during session
  wordRatings: text("word_ratings"),
  // JSON: NewWordEntry[] — new words added during session
  newWords: text("new_words"),
});

export const levelHistory = sqliteTable("level_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckName: text("deck_name").notNull(),
  level: real("level").notNull(),
  changedAt: text("changed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  reason: text("reason").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ─── Review Sessions ──────────────────────────────────────────────────────────

export const reviewSessions = sqliteTable("review_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckName: text("deck_name").notNull(),
  language: text("language").notNull().default("Korean"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  totalCards: integer("total_cards").notNull().default(0),
  // JSON: { again: number; hard: number; good: number; easy: number }
  ratingBreakdown: text("rating_breakdown").notNull().default('{"again":0,"hard":0,"good":0,"easy":0}'),
  // JSON: Array<{ cardId, noteId, front, back, ease }>
  cardRatings: text("card_ratings"),
  durationSeconds: integer("duration_seconds"),
});

// ─── Writing Sessions ─────────────────────────────────────────────────────────

export const writingSessions = sqliteTable("writing_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckName: text("deck_name").notNull(),
  language: text("language").notNull().default("Korean"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  // JSON: Array<{ promptWord, userSentence, score, corrections, suggestedVersion }>
  exercises: text("exercises").notNull().default("[]"),
  totalExercises: integer("total_exercises").notNull().default(0),
  averageScore: real("average_score"),
});

// ─── Dictation Sessions ───────────────────────────────────────────────────────

export const dictationSessions = sqliteTable("dictation_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckName: text("deck_name"),
  language: text("language").notNull().default("Korean"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  sourceType: text("source_type").notNull().default("custom"), // 'story' | 'custom' | 'import'
  // JSON: Array<{ originalText, userText, accuracy }>
  exercises: text("exercises").notNull().default("[]"),
  totalExercises: integer("total_exercises").notNull().default(0),
  averageAccuracy: real("average_accuracy"),
});

// ─── Cloze Sessions ───────────────────────────────────────────────────────────

export const clozeSessions = sqliteTable("cloze_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckName: text("deck_name"),
  language: text("language").notNull().default("Korean"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  sourceType: text("source_type").notNull().default("custom"),
  passage: text("passage").notNull(),
  // JSON: Array<{ index, answer, userAnswer, correct, hintsUsed }>
  blanks: text("blanks").notNull().default("[]"),
  totalBlanks: integer("total_blanks").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  score: real("score"),
});

// ─── Imported Texts ───────────────────────────────────────────────────────────

export const importedTexts = sqliteTable("imported_texts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckName: text("deck_name"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  title: text("title"),
  text: text("text").notNull(),
  // JSON: { knownCount, reviewSoonCount, unknownCount }
  analysis: text("analysis"),
  translation: text("translation"),
  timesStudied: integer("times_studied").notNull().default(0),
});

// ─── Chat Conversations ───────────────────────────────────────────────────────

export const chatConversations = sqliteTable("chat_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckName: text("deck_name"),
  language: text("language").notNull().default("Korean"),
  mode: text("mode").notNull().default("mixed"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  messageCount: integer("message_count").notNull().default(0),
  correctionsCount: integer("corrections_count").notNull().default(0),
  // JSON: Array<{ role, content, corrections? }>
  messages: text("messages").notNull().default("[]"),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type LevelHistoryEntry = typeof levelHistory.$inferSelect;
export type NewLevelHistoryEntry = typeof levelHistory.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type ReviewSession = typeof reviewSessions.$inferSelect;
export type NewReviewSession = typeof reviewSessions.$inferInsert;
export type WritingSession = typeof writingSessions.$inferSelect;
export type NewWritingSession = typeof writingSessions.$inferInsert;
export type DictationSession = typeof dictationSessions.$inferSelect;
export type NewDictationSession = typeof dictationSessions.$inferInsert;
export type ClozeSession = typeof clozeSessions.$inferSelect;
export type NewClozeSession = typeof clozeSessions.$inferInsert;
export type ImportedText = typeof importedTexts.$inferSelect;
export type NewImportedText = typeof importedTexts.$inferInsert;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;
