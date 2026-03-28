import { NextRequest, NextResponse } from "next/server";
import type { AnkiCard } from "@/types";
import { cardFront, cardBack } from "@/types";

const ANKI_SERVICE_URL = process.env.ANKI_SERVICE_URL ?? "http://localhost:5000";

export type MasteryLevel = "new" | "learning" | "young" | "mature";

export interface VocabWord {
  cardId: number;
  noteId: number;
  front: string;
  back: string;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  type: number;
  mastery: MasteryLevel;
  due: number;
}

export interface VocabStats {
  total: number;
  new: number;
  learning: number;
  young: number;
  mature: number;
}

function getMastery(card: AnkiCard): MasteryLevel {
  if (card.type === 0) return "new";
  if (card.type === 1 || card.type === 3) return "learning";
  if (card.interval < 21) return "young";
  return "mature";
}

export async function GET(req: NextRequest) {
  const deckName = req.nextUrl.searchParams.get("deckName");
  if (!deckName) {
    return NextResponse.json({ error: "deckName is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${ANKI_SERVICE_URL}/all-cards?deck_name=${encodeURIComponent(deckName)}`
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = (await res.json()) as { cards: AnkiCard[]; total: number };
    const words: VocabWord[] = data.cards.map((card) => ({
      cardId: card.cardId,
      noteId: card.noteId,
      front: cardFront(card).replace(/<[^>]+>/g, "").trim(),
      back: cardBack(card).replace(/<[^>]+>/g, "").trim(),
      interval: card.interval,
      ease: card.ease,
      reps: card.reps,
      lapses: card.lapses,
      type: card.type,
      mastery: getMastery(card),
      due: card.due,
    }));

    const stats: VocabStats = {
      total: words.length,
      new: words.filter((w) => w.mastery === "new").length,
      learning: words.filter((w) => w.mastery === "learning").length,
      young: words.filter((w) => w.mastery === "young").length,
      mature: words.filter((w) => w.mastery === "mature").length,
    };

    return NextResponse.json({ words, stats });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load vocab" },
      { status: 500 }
    );
  }
}
