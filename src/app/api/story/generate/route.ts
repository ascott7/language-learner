import { NextRequest, NextResponse } from "next/server";
import { generateStory } from "@/lib/claude-client";
import type { GenerateStoryRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { cards, language, level } = (await req.json()) as GenerateStoryRequest;

    if (!cards?.length || !language || !level) {
      return NextResponse.json(
        { error: "cards, language, and level are required" },
        { status: 400 },
      );
    }

    const story = await generateStory(cards, language, level);
    return NextResponse.json(story);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Story generation failed";
    console.error("POST /api/story/generate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
