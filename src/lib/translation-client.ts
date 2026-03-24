/**
 * Google Cloud Translation API v2 client + composite word lookup.
 */
import { analyzeWord } from "./anki-service-client";

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY ?? "";
const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translation/v2";

/** Map human-readable language names to ISO 639-1 codes. */
const LANGUAGE_CODES: Record<string, string> = {
  korean: "ko",
  japanese: "ja",
  chinese: "zh",
  spanish: "es",
  french: "fr",
  german: "de",
  italian: "it",
  portuguese: "pt",
  russian: "ru",
  arabic: "ar",
  thai: "th",
  vietnamese: "vi",
  hindi: "hi",
  english: "en",
};

function toLanguageCode(language: string): string {
  return LANGUAGE_CODES[language.toLowerCase()] ?? language.toLowerCase().slice(0, 2);
}

/**
 * Translate text using Google Cloud Translation API v2.
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string = "en",
): Promise<string> {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY is not set");
  }

  const params = new URLSearchParams({
    q: text,
    source: toLanguageCode(sourceLanguage),
    target: toLanguageCode(targetLanguage),
    format: "text",
    key: GOOGLE_TRANSLATE_API_KEY,
  });

  const res = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`, { method: "POST" });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    const msg = (err as { error?: { message?: string } }).error?.message ?? res.statusText;
    throw new Error(`Google Translate API error: ${msg}`);
  }

  const data = (await res.json()) as {
    data: { translations: Array<{ translatedText: string }> };
  };

  return data.data.translations[0]?.translatedText ?? "";
}

/**
 * Look up a word: get its base form (via kiwipiepy) and English definition
 * (via Google Translate). Replaces the Claude-based getLookupDefinition.
 */
export async function lookupWord(
  word: string,
  sentence: string,
  language: string,
): Promise<{ baseForm: string; definition: string }> {
  const { baseForm } = await analyzeWord(word, sentence);
  if (!language) {
    return { baseForm, definition: "" };
  }
  const definition = await translateText(baseForm, language, "en");
  return { baseForm, definition };
}
