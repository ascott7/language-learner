import { NextRequest, NextResponse } from "next/server";
import { getDueCards, AnkiServiceError } from "@/lib/anki-service-client";

export async function POST(req: NextRequest) {
  try {
    const { deckName } = (await req.json()) as { deckName: string };
    if (!deckName) {
      return NextResponse.json({ error: "deckName is required" }, { status: 400 });
    }
    const result = await getDueCards(deckName);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnkiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
