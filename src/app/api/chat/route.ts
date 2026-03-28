import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// TODO: replace with a cheaper model (Gemini Flash, GPT-4o-mini, DeepSeek)
// when ready. Claude Haiku is used for now to keep the app self-contained.
const MODEL = "claude-haiku-4-5-20251001";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface ChatResponse {
  reply: string;
  corrections?: ChatCorrection[];
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, mode, language } = (await req.json()) as {
      message: string;
      history: ChatMessage[];
      mode: "korean-only" | "mixed";
      language: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const systemPrompt = mode === "korean-only"
      ? `You are a friendly ${language} conversation partner. Respond ONLY in ${language}.
Keep your responses natural and conversational, appropriate for a language learner.
If the user makes grammar errors, note them briefly at the end of your response
in parentheses in English, like: (Grammar note: ...).`
      : `You are a friendly ${language} conversation partner helping someone learn the language.
Respond primarily in ${language}, but you may include English translations for complex phrases
in brackets like [translation]. If the user makes grammar errors, include a brief correction
at the end of your response in English, like: (Grammar note: ...).`;

    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const replyText = response.content.find((b) => b.type === "text")?.text ?? "";

    // Extract grammar corrections if present
    const corrections: ChatCorrection[] = [];
    const grammarMatch = replyText.match(/\(Grammar note: ([^)]+)\)/);
    if (grammarMatch) {
      corrections.push({
        original: message,
        corrected: "",
        explanation: grammarMatch[1],
      });
    }

    return NextResponse.json({ reply: replyText, corrections } satisfies ChatResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}
