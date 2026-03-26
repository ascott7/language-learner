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

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type LevelHistoryEntry = typeof levelHistory.$inferSelect;
export type NewLevelHistoryEntry = typeof levelHistory.$inferInsert;
export type Setting = typeof settings.$inferSelect;
