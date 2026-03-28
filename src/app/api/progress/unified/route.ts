import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sessions,
  reviewSessions,
  writingSessions,
  dictationSessions,
  clozeSessions,
  chatConversations,
} from "@/lib/db/schema";

export type ActivityType = "story" | "review" | "writing" | "dictation" | "cloze" | "chat";

export interface ActivityItem {
  id: number;
  type: ActivityType;
  title: string;
  subtitle: string;
  createdAt: string;
  score?: number; // 0-1 for review/cloze/dictation, 0-100 for writing
  detailHref?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deckName = searchParams.get("deckName") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  try {
    const activities: ActivityItem[] = [];

    // Story sessions
    const storyRows = deckName
      ? await db.select().from(sessions).where(eq(sessions.deckName, deckName)).orderBy(desc(sessions.createdAt)).limit(limit)
      : await db.select().from(sessions).orderBy(desc(sessions.createdAt)).limit(limit);

    for (const row of storyRows) {
      const rb = JSON.parse(row.ratingBreakdown) as { again: number; hard: number; good: number; easy: number };
      const total = rb.again + rb.hard + rb.good + rb.easy;
      const score = total > 0 ? (rb.good + rb.easy) / total : undefined;
      activities.push({
        id: row.id,
        type: "story",
        title: row.storyTitle,
        subtitle: `${row.totalFlashcardWords} words · Grade ${row.storyGradeLevel}`,
        createdAt: row.createdAt,
        score,
        detailHref: `/progress/${row.id}`,
      });
    }

    // Review sessions
    const reviewRows = deckName
      ? await db.select().from(reviewSessions).where(eq(reviewSessions.deckName, deckName)).orderBy(desc(reviewSessions.createdAt)).limit(limit)
      : await db.select().from(reviewSessions).orderBy(desc(reviewSessions.createdAt)).limit(limit);

    for (const row of reviewRows) {
      const rb = JSON.parse(row.ratingBreakdown) as { again: number; hard: number; good: number; easy: number };
      const total = rb.again + rb.hard + rb.good + rb.easy;
      const score = total > 0 ? (rb.good + rb.easy) / total : undefined;
      activities.push({
        id: row.id,
        type: "review",
        title: `Flashcard review`,
        subtitle: `${row.totalCards} cards`,
        createdAt: row.createdAt,
        score,
      });
    }

    // Writing sessions
    const writingRows = deckName
      ? await db.select().from(writingSessions).where(eq(writingSessions.deckName, deckName)).orderBy(desc(writingSessions.createdAt)).limit(limit)
      : await db.select().from(writingSessions).orderBy(desc(writingSessions.createdAt)).limit(limit);

    for (const row of writingRows) {
      activities.push({
        id: row.id,
        type: "writing",
        title: `Writing practice`,
        subtitle: `${row.totalExercises} sentences`,
        createdAt: row.createdAt,
        score: row.averageScore !== null ? row.averageScore : undefined,
      });
    }

    // Dictation sessions
    const dictationRows = await db.select().from(dictationSessions).orderBy(desc(dictationSessions.createdAt)).limit(limit);
    for (const row of dictationRows) {
      if (deckName && row.deckName && row.deckName !== deckName) continue;
      activities.push({
        id: row.id,
        type: "dictation",
        title: `Listening exercise`,
        subtitle: `${row.totalExercises} passages · ${row.sourceType}`,
        createdAt: row.createdAt,
        score: row.averageAccuracy !== null ? row.averageAccuracy : undefined,
      });
    }

    // Cloze sessions
    const clozeRows = await db.select().from(clozeSessions).orderBy(desc(clozeSessions.createdAt)).limit(limit);
    for (const row of clozeRows) {
      if (deckName && row.deckName && row.deckName !== deckName) continue;
      activities.push({
        id: row.id,
        type: "cloze",
        title: `Fill in the blank`,
        subtitle: `${row.totalBlanks} blanks · ${Math.round((row.score ?? 0) * 100)}% correct`,
        createdAt: row.createdAt,
        score: row.score !== null ? row.score : undefined,
      });
    }

    // Chat conversations
    const chatRows = await db.select().from(chatConversations).orderBy(desc(chatConversations.createdAt)).limit(limit);
    for (const row of chatRows) {
      if (deckName && row.deckName && row.deckName !== deckName) continue;
      activities.push({
        id: row.id,
        type: "chat",
        title: `AI conversation`,
        subtitle: `${row.messageCount} messages · ${row.mode}`,
        createdAt: row.createdAt,
      });
    }

    // Sort all by createdAt desc
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ activities: activities.slice(0, limit) });
  } catch (err) {
    console.error("GET /api/progress/unified error:", err);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
}
