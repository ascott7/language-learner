import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import type { StoryWord, WordRating, NewWordEntry } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  try {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      deckName: row.deckName,
      language: row.language,
      createdAt: row.createdAt,
      storyTitle: row.storyTitle,
      storyText: row.storyText,
      storyGradeLevel: row.storyGradeLevel,
      totalFlashcardWords: row.totalFlashcardWords,
      ratingBreakdown: JSON.parse(row.ratingBreakdown) as {
        again: number;
        hard: number;
        good: number;
        easy: number;
      },
      newWordsAdded: row.newWordsAdded,
      difficultyFeedback: row.difficultyFeedback,
      storyWords: row.storyWords
        ? (JSON.parse(row.storyWords) as StoryWord[])
        : null,
      flashcardWordIndices: row.flashcardWordIndices
        ? (JSON.parse(row.flashcardWordIndices) as number[])
        : null,
      wordRatings: row.wordRatings
        ? (JSON.parse(row.wordRatings) as WordRating[])
        : null,
      newWords: row.newWords
        ? (JSON.parse(row.newWords) as NewWordEntry[])
        : null,
    });
  } catch (err) {
    console.error("GET /api/progress/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 },
    );
  }
}
