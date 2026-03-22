import type { AnkiCard, GeneratedStory, StoryWord } from "@/types";

interface RawFlashcardPosition {
  noteId: number;
  surfaceForm: string;
  baseForm: string;
  start: number;
  end: number;
}

interface RawStoryResponse {
  title: string;
  story: string;
  language: string;
  gradeLevel: number;
  flashcardPositions: RawFlashcardPosition[];
}

/**
 * Normalize a string for fuzzy matching:
 * lowercase + strip combining diacritical marks.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Find the actual start index of `needle` in `haystack`, starting from `hint`.
 * Falls back to fuzzy (normalized) matching if exact match fails.
 * Returns -1 if not found.
 */
function findPosition(
  haystack: string,
  needle: string,
  hint: number,
): number {
  // 1. Exact match near hint
  const nearby = haystack.indexOf(needle, Math.max(0, hint - 20));
  if (nearby !== -1) return nearby;

  // 2. Exact match anywhere
  const anywhere = haystack.indexOf(needle);
  if (anywhere !== -1) return anywhere;

  // 3. Fuzzy: normalize both and search
  const normHaystack = normalize(haystack);
  const normNeedle = normalize(needle);
  const fuzzy = normHaystack.indexOf(normNeedle);
  return fuzzy; // -1 if not found
}

/**
 * Tokenize `story` into an array of StoryWord objects.
 * Words are split on whitespace and leading/trailing punctuation.
 * Each token records its exact character range in the story string.
 *
 * The resulting array contains every token — flashcardNoteId will be set
 * for tokens that overlap with a verified flashcard position.
 */
function tokenizeStory(
  story: string,
  verifiedPositions: Array<{ start: number; end: number; noteId: number; surfaceForm: string; baseForm: string }>,
): StoryWord[] {
  // Build a map from character index -> noteId for O(1) lookup
  const noteIdAt = new Map<number, { noteId: number; baseForm: string }>();
  for (const pos of verifiedPositions) {
    for (let i = pos.start; i < pos.end; i++) {
      noteIdAt.set(i, { noteId: pos.noteId, baseForm: pos.baseForm });
    }
  }

  const words: StoryWord[] = [];
  // Regex: match sequences of non-whitespace characters
  const tokenRegex = /\S+/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = tokenRegex.exec(story)) !== null) {
    const raw = match[0];
    const rawStart = match.index;

    // Strip leading and trailing punctuation to get the "word" portion
    const stripped = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const leadingPunct = raw.length - raw.replace(/^[^\p{L}\p{N}]+/gu, "").length;
    const wordStart = rawStart + leadingPunct;
    const wordEnd = wordStart + stripped.length;

    const overlappingEntry = noteIdAt.get(wordStart);

    words.push({
      index,
      text: stripped || raw,
      start: wordStart,
      end: wordEnd,
      flashcardNoteId: overlappingEntry?.noteId ?? null,
      baseForm: overlappingEntry?.baseForm ?? null,
    });

    index++;
  }

  return words;
}

/**
 * Parse Claude's raw JSON story output, verify word positions,
 * and return a fully-typed GeneratedStory.
 */
export function parseStory(rawText: string, cards: AnkiCard[]): GeneratedStory {
  // Strip markdown code fences if present
  const cleaned = rawText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  let raw: RawStoryResponse;
  try {
    raw = JSON.parse(cleaned) as RawStoryResponse;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${rawText.slice(0, 200)}`);
  }

  const { title, story, language, gradeLevel, flashcardPositions } = raw;

  if (!title || !story) {
    throw new Error("Claude response missing required fields (title, story)");
  }

  // Build noteId → cardId map for cross-referencing
  const noteIdToCardId = new Map<number, number>(
    cards.map((c) => [c.noteId, c.cardId]),
  );

  // Verify and correct each flashcard position
  const verified: Array<{
    start: number;
    end: number;
    noteId: number;
    surfaceForm: string;
    baseForm: string;
  }> = [];

  for (const pos of flashcardPositions ?? []) {
    const { noteId, surfaceForm, baseForm, start } = pos;

    if (!surfaceForm || !noteIdToCardId.has(noteId)) continue;

    // Check if Claude's reported position is correct
    const reportedSlice = story.substring(pos.start, pos.end);
    if (reportedSlice === surfaceForm) {
      verified.push({ start: pos.start, end: pos.end, noteId, surfaceForm, baseForm });
      continue;
    }

    // Position is wrong — find the actual location
    const actualStart = findPosition(story, surfaceForm, start);
    if (actualStart === -1) continue; // can't locate, skip

    verified.push({
      start: actualStart,
      end: actualStart + surfaceForm.length,
      noteId,
      surfaceForm,
      baseForm,
    });
  }

  const words = tokenizeStory(story, verified);
  const flashcardWordIndices = words
    .filter((w) => w.flashcardNoteId !== null)
    .map((w) => w.index);

  return {
    title,
    story,
    language,
    gradeLevel: gradeLevel ?? 5,
    words,
    flashcardWordIndices,
  };
}
