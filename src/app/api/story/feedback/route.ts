import { NextRequest, NextResponse } from "next/server";
import { applyFeedback, incrementStoryCount } from "@/lib/level-tracker";
import type { DifficultyFeedback } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { deckName, feedback, storyGradeLevel } = (await req.json()) as {
      deckName: string;
      feedback: DifficultyFeedback;
      storyGradeLevel: number;
    };

    if (!deckName || !feedback) {
      return NextResponse.json(
        { error: "deckName and feedback are required" },
        { status: 400 },
      );
    }

    await incrementStoryCount(deckName);
    const newLevel = await applyFeedback(deckName, feedback, storyGradeLevel);

    return NextResponse.json({ newLevel, success: true });
  } catch (err) {
    console.error("POST /api/story/feedback error:", err);
    return NextResponse.json({ error: "Failed to apply feedback" }, { status: 500 });
  }
}
