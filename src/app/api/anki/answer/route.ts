import { NextRequest, NextResponse } from "next/server";
import { answerCard, AnkiServiceError } from "@/lib/anki-service-client";
import type { AnkiEase } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { cardId, ease } = (await req.json()) as {
      cardId: number;
      ease: AnkiEase;
    };
    if (!cardId || ![1, 2, 3, 4].includes(ease)) {
      return NextResponse.json(
        { error: "cardId and ease (1-4) are required" },
        { status: 400 },
      );
    }
    const result = await answerCard(cardId, ease);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnkiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
