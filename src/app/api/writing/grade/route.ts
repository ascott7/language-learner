import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

export interface GradingCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface GradingResult {
  score: number;         // 0-100
  corrections: GradingCorrection[];
  grammarNotes: string[];
  suggestedVersion: string;
  isCorrect: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { sentence, promptWord, language } = (await req.json()) as {
      sentence: string;
      promptWord: string;
      language: string;
    };

    if (!sentence?.trim()) {
      return NextResponse.json({ error: "sentence is required" }, { status: 400 });
    }

    const prompt = `You are a ${language} language teacher grading a student's sentence.

The student was asked to write a sentence using the word: "${promptWord}"
The student wrote: "${sentence}"

Grade the sentence on a scale of 0-100 considering:
- Grammar correctness (40 points)
- Natural usage of the target word (30 points)
- Overall naturalness and fluency (30 points)

Respond with ONLY valid JSON in this exact format:
{
  "score": <number 0-100>,
  "corrections": [
    {"original": "<the incorrect part>", "corrected": "<the correct version>", "explanation": "<brief explanation in English>"}
  ],
  "grammarNotes": ["<note 1>", "<note 2>"],
  "suggestedVersion": "<a natural ${language} version of the sentence>",
  "isCorrect": <true if score >= 80, else false>
}

If the sentence is perfect, return an empty corrections array.
Keep explanations concise and encouraging.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse grading response" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]) as GradingResult;
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Grading failed" },
      { status: 500 }
    );
  }
}
