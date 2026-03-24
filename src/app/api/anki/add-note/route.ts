import { NextRequest, NextResponse } from "next/server";
import { addNote, findNotes, AnkiServiceError } from "@/lib/anki-service-client";
import { lookupWord } from "@/lib/translation-client";

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
      const lookup = await lookupWord(word, sentence, language ?? "");

      // Check if a note with this base form already exists in the collection
      let existingNote: { front: string; back: string } | null = null;
      try {
        const found = await findNotes(`"${lookup.baseForm}"`);
        if (found.exists && found.notes.length > 0) {
          existingNote = { front: found.notes[0].front, back: found.notes[0].back };
        }
      } catch {
        // Non-fatal — proceed without duplicate check
      }

      return NextResponse.json({
        baseForm: lookup.baseForm,
        definition: lookup.definition,
        existingNote,
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
    console.error("POST /api/anki/add-note error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
