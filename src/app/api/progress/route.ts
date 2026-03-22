import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { getCurrentLevel, getLevelHistory } from "@/lib/level-tracker";
import type { SessionRecord } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deckName = searchParams.get("deckName") ?? "";
  const days = parseInt(searchParams.get("days") ?? "30", 10);

  try {
    const rows = deckName
      ? await db
          .select()
          .from(sessions)
          .where(eq(sessions.deckName, deckName))
          .orderBy(desc(sessions.createdAt))
          .limit(days * 5)
      : await db
          .select()
          .from(sessions)
          .orderBy(desc(sessions.createdAt))
          .limit(days * 5);

    const sessionRecords: SessionRecord[] = rows.map((row) => ({
      id: row.id,
      deckName: row.deckName,
      language: row.language,
      createdAt: row.createdAt,
      storyTitle: row.storyTitle,
      storyGradeLevel: row.storyGradeLevel,
      totalFlashcardWords: row.totalFlashcardWords,
      ratingBreakdown: JSON.parse(row.ratingBreakdown) as SessionRecord["ratingBreakdown"],
      newWordsAdded: row.newWordsAdded,
      difficultyFeedback: row.difficultyFeedback as SessionRecord["difficultyFeedback"],
    }));

    const currentLevel = deckName ? await getCurrentLevel(deckName) : null;
    const levelHistoryData = deckName ? await getLevelHistory(deckName) : [];

    return NextResponse.json({
      sessions: sessionRecords,
      currentLevel,
      levelHistory: levelHistoryData,
    });
  } catch (err) {
    console.error("GET /api/progress error:", err);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      deckName: string;
      language: string;
      storyTitle: string;
      storyText: string;
      storyGradeLevel: number;
      totalFlashcardWords: number;
      ratingBreakdown: { again: number; hard: number; good: number; easy: number };
      newWordsAdded: number;
      difficultyFeedback?: string;
    };

    await db.insert(sessions).values({
      deckName: body.deckName,
      language: body.language,
      storyTitle: body.storyTitle,
      storyText: body.storyText,
      storyGradeLevel: body.storyGradeLevel,
      totalFlashcardWords: body.totalFlashcardWords,
      ratingBreakdown: JSON.stringify(body.ratingBreakdown),
      newWordsAdded: body.newWordsAdded,
      difficultyFeedback: body.difficultyFeedback ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/progress error:", err);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
