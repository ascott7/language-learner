import { NextRequest, NextResponse } from "next/server";
import { addNote, AnkiServiceError } from "@/lib/anki-service-client";
import { getLookupDefinition } from "@/lib/claude-client";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      deckName?: string;
      word?: string;
      sentence?: string;
      language?: string;
      lookupOnly?: boolean;
      // Pre-computed front/back when saving after editing
      front?: string;
      back?: string;
    };

    const { deckName, lookupOnly } = body;

    // Mode 1: lookup only — call Claude, return baseForm + definition, do NOT add to Anki
    if (lookupOnly) {
      const { word, sentence, language } = body;
      if (!word || !sentence) {
        return NextResponse.json(
          { error: "word and sentence are required for lookup" },
          { status: 400 },
        );
      }
      const lookup = await getLookupDefinition(word, sentence, language ?? "");
      return NextResponse.json({
        baseForm: lookup.baseForm,
        definition: lookup.definition,
      });
    }

    // Mode 2: save to Anki — front/back provided directly (after user editing)
    const { front, back } = body;
    if (!deckName || !front || !back) {
      return NextResponse.json(
        { error: "deckName, front, and back are required to add a note" },
        { status: 400 },
      );
    }

    const result = await addNote({
      deckName,
      front,
      back,
      tags: ["language-learner", "auto-added"],
    });

    return NextResponse.json({ noteId: result.noteId, success: true });
  } catch (err) {
    if (err instanceof AnkiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
