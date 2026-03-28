import { NextRequest, NextResponse } from "next/server";

const ANKI_SERVICE_URL = process.env.ANKI_SERVICE_URL ?? "http://localhost:5000";

export interface Morpheme {
  form: string;
  base: string;
  tag: string;
  label_en: string;
  label_ko: string;
  color: string;
  start: number;
  end: number;
}

export async function POST(req: NextRequest) {
  try {
    const { sentence } = (await req.json()) as { sentence: string };
    if (!sentence?.trim()) {
      return NextResponse.json({ morphemes: [], sentence: "" });
    }

    const res = await fetch(`${ANKI_SERVICE_URL}/analyze-sentence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = (await res.json()) as { morphemes: Morpheme[]; sentence: string };
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Grammar analysis failed" },
      { status: 500 }
    );
  }
}
