import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/translation-client";
import type { TranslateRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { story, sourceLanguage } = (await req.json()) as TranslateRequest;

    if (!story || !sourceLanguage) {
      return NextResponse.json(
        { error: "story and sourceLanguage are required" },
        { status: 400 },
      );
    }

    const translation = await translateText(story, sourceLanguage, "en");
    return NextResponse.json({ translation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    console.error("POST /api/story/translate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
