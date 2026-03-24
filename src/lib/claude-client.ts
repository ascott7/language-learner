/**
 * Claude API client — story generation, translation, and word lookup.
 * Full implementation in task 5; this stub satisfies the type system.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { AnkiCard, GeneratedStory } from "@/types";
import { parseStory } from "./story-parser";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model to use — Haiku is sufficient and very cost-effective
const MODEL = "claude-haiku-4-5-20251001";

// ─── Story Generation ─────────────────────────────────────────────────────────

export async function generateStory(
  cards: AnkiCard[],
  language: string,
  level: number,
): Promise<GeneratedStory> {
  const wordList = cards
    .map((c) => {
      const front = c.fields["Front"]?.value ?? c.fields["Word"]?.value ?? Object.values(c.fields)[0]?.value ?? "";
      const back = c.fields["Back"]?.value ?? c.fields["Meaning"]?.value ?? Object.values(c.fields)[1]?.value ?? "";
      return `  - noteId: ${c.noteId}, word: "${front}", meaning: "${back}"`;
    })
    .join("\n");

  const prompt = `Write a short story (150-250 words) in ${language} at approximately grade ${level} reading level (1=very beginner, 12=advanced). The story should naturally incorporate the following vocabulary words. Each word may appear in conjugated/declined form as appropriate for natural grammar.

Vocabulary words to incorporate (use each at least once):
${wordList}

Return ONLY a JSON object with this exact structure — no markdown, no explanation:
{
  "title": "Story title in ${language}",
  "story": "The full story text as a single string with paragraph breaks using \\n\\n",
  "language": "${language}",
  "gradeLevel": <number 1-12 reflecting the actual difficulty>,
  "flashcardPositions": [
    {
      "noteId": <the noteId integer from the vocabulary list>,
      "surfaceForm": "the exact text as it appears in the story",
      "baseForm": "the dictionary/base form matching the flashcard",
      "start": <character index where surfaceForm starts in the story string>,
      "end": <character index where surfaceForm ends (exclusive) in the story string>
    }
  ]
}

CRITICAL: Verify each start/end index by checking that story.substring(start, end) === surfaceForm exactly.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseStory(text, cards);
}

