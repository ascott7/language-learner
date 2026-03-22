import { NextRequest, NextResponse } from "next/server";
import { addNote, AnkiServiceError } from "@/lib/anki-service-client";
import { getLookupDefinition } from "@/lib/claude-client";

export async function POST(req: NextRequest) {
  try {
    const { deckName, word, sentence, language } = (await req.json()) as {
      deckName: string;
      word: string;
      sentence: string;
      language: string;
    };

    if (!deckName || !word || !sentence) {
      return NextResponse.json(
        { error: "deckName, word, and sentence are required" },
        { status: 400 },
      );
    }

    // Use Claude to get the dictionary form and definition from context
    const lookup = await getLookupDefinition(word, sentence, language);

    // Add to Anki with base form as front, definition as back
    const result = await addNote({
      deckName,
      front: lookup.baseForm,
      back: lookup.definition,
      tags: ["language-learner", "auto-added"],
    });

    return NextResponse.json({
      noteId: result.noteId,
      baseForm: lookup.baseForm,
      definition: lookup.definition,
      success: true,
    });
  } catch (err) {
    if (err instanceof AnkiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
