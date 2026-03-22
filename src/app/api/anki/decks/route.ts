import { NextResponse } from "next/server";
import { getDecks } from "@/lib/anki-service-client";
import { AnkiServiceError } from "@/lib/anki-service-client";

export async function GET() {
  try {
    const decks = await getDecks();
    return NextResponse.json({ decks });
  } catch (err) {
    if (err instanceof AnkiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
