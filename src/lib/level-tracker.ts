import { db } from "@/lib/db";
import { levelHistory, settings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { DifficultyFeedback } from "@/types";

const DEFAULT_LEVEL = 3;
const LEVEL_MIN = 1;
const LEVEL_MAX = 12;
const STORIES_BEFORE_PROBE = 3; // every N stories, probe one level up

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function settingsKey(deckName: string): string {
  return `level:${deckName}`;
}

function storyCountKey(deckName: string): string {
  return `storyCount:${deckName}`;
}

/** Get the current level for a deck (1–12). */
export async function getCurrentLevel(deckName: string): Promise<number> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, settingsKey(deckName)));
  return rows[0] ? parseFloat(rows[0].value) : DEFAULT_LEVEL;
}

/** Get the target level for the next story (may probe one higher). */
export async function getTargetLevel(deckName: string): Promise<number> {
  const current = await getCurrentLevel(deckName);
  const countRows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, storyCountKey(deckName)));
  const count = countRows[0] ? parseInt(countRows[0].value, 10) : 0;

  // Every Nth story, probe one level higher
  if (count > 0 && count % STORIES_BEFORE_PROBE === 0) {
    return clamp(current + 1, LEVEL_MIN, LEVEL_MAX);
  }
  return current;
}

/** Increment the story count for a deck. */
export async function incrementStoryCount(deckName: string): Promise<void> {
  const countRows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, storyCountKey(deckName)));
  const current = countRows[0] ? parseInt(countRows[0].value, 10) : 0;
  const newCount = (current + 1).toString();

  await db
    .insert(settings)
    .values({ key: storyCountKey(deckName), value: newCount })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: newCount },
    });
}

/**
 * Apply the user's difficulty feedback to the level.
 * Returns the new level.
 */
export async function applyFeedback(
  deckName: string,
  feedback: DifficultyFeedback,
  storyGradeLevel: number,
): Promise<number> {
  const current = await getCurrentLevel(deckName);
  let next = current;
  let reason = "";

  switch (feedback) {
    case "too_easy":
      next = clamp(current + 0.5, LEVEL_MIN, LEVEL_MAX);
      reason = `Story was too easy (grade ${storyGradeLevel}); level increased`;
      break;
    case "about_right":
      next = current;
      reason = `Story difficulty was about right (grade ${storyGradeLevel}); level unchanged`;
      break;
    case "too_hard":
      next = clamp(current - 0.5, LEVEL_MIN, LEVEL_MAX);
      reason = `Story was too hard (grade ${storyGradeLevel}); level decreased`;
      break;
  }

  if (next !== current) {
    // Persist the new level
    await db
      .insert(settings)
      .values({ key: settingsKey(deckName), value: next.toString() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: next.toString() },
      });

    // Record in history
    await db.insert(levelHistory).values({
      deckName,
      level: next,
      reason,
    });
  }

  return next;
}

/** Get the level history for a deck, most recent first. */
export async function getLevelHistory(
  deckName: string,
  limit = 30,
): Promise<Array<{ level: number; changedAt: string; reason: string }>> {
  const rows = await db
    .select()
    .from(levelHistory)
    .where(eq(levelHistory.deckName, deckName))
    .orderBy(desc(levelHistory.changedAt))
    .limit(limit);
  return rows;
}
