import { NextRequest, NextResponse } from "next/server";

const ANKI_SERVICE_URL = process.env.ANKI_SERVICE_URL ?? "http://localhost:5000";

export interface AnalyzedWord {
  text: string;
  start: number;
  end: number;
  category: "known" | "review_soon" | "unknown" | "other";
  baseForm?: string;
}

export interface ImportAnalysisResult {
  words: AnalyzedWord[];
  knownCount: number;
  reviewSoonCount: number;
  unknownCount: number;
}

export async function POST(req: NextRequest) {
  try {
    const { text, deckName } = (await req.json()) as { text: string; deckName?: string };
    if (!text?.trim()) {
      return NextResponse.json({ words: [], knownCount: 0, reviewSoonCount: 0, unknownCount: 0 });
    }

    // First, tokenize with morphological analysis to extract Korean words
    const analyzeRes = await fetch(`${ANKI_SERVICE_URL}/analyze-sentence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence: text }),
    });

    if (!analyzeRes.ok) {
      return NextResponse.json({ error: "Morphological analysis failed" }, { status: 500 });
    }

    const analyzed = (await analyzeRes.json()) as {
      morphemes: Array<{ form: string; base: string; tag: string; start: number; end: number }>;
    };

    // Extract content word morphemes (nouns, verbs, adjectives, adverbs)
    const contentTags = new Set(["NNG", "NNP", "NNB", "NR", "NP", "VV", "VA", "VX", "VCP", "VCN", "MAG"]);
    const contentMorphemes = analyzed.morphemes.filter((m) => contentTags.has(m.tag));

    if (!deckName || contentMorphemes.length === 0) {
      // No deck — just tokenize without categorizing
      const words: AnalyzedWord[] = analyzed.morphemes.map((m) => ({
        text: m.form,
        start: m.start,
        end: m.end,
        category: "other",
        baseForm: m.base,
      }));
      return NextResponse.json({ words, knownCount: 0, reviewSoonCount: 0, unknownCount: 0 });
    }

    // Check which words exist in the deck
    const uniqueWords = [...new Set(contentMorphemes.map((m) => m.base || m.form))];
    const checkRes = await fetch(`${ANKI_SERVICE_URL}/deck-vocab-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words: uniqueWords, deck_name: deckName }),
    });

    let knownSet = new Set<string>();
    let reviewSoonSet = new Set<string>();

    if (checkRes.ok) {
      const checkData = (await checkRes.json()) as {
        known: string[];
        review_soon: string[];
        unknown: string[];
      };
      knownSet = new Set(checkData.known);
      reviewSoonSet = new Set(checkData.review_soon);
    }

    // Build the word list from all morphemes (not just content words)
    const words: AnalyzedWord[] = analyzed.morphemes.map((m) => {
      const base = m.base || m.form;
      let category: AnalyzedWord["category"] = "other";
      if (contentTags.has(m.tag)) {
        if (reviewSoonSet.has(base)) category = "review_soon";
        else if (knownSet.has(base)) category = "known";
        else category = "unknown";
      }
      return {
        text: m.form,
        start: m.start,
        end: m.end,
        category,
        baseForm: m.base,
      };
    });

    return NextResponse.json({
      words,
      knownCount: knownSet.size,
      reviewSoonCount: reviewSoonSet.size,
      unknownCount: words.filter((w) => w.category === "unknown").length,
    } satisfies ImportAnalysisResult);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import analysis failed" },
      { status: 500 }
    );
  }
}
