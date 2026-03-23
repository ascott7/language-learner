import type { AnkiCard, AnkiEase } from "@/types";

const ANKI_SERVICE_URL =
  process.env.ANKI_SERVICE_URL ?? "http://localhost:5000";

class AnkiServiceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AnkiServiceError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${ANKI_SERVICE_URL}${path}`;
  let res: Response;

  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new AnkiServiceError(
      503,
      `Cannot reach Anki service at ${ANKI_SERVICE_URL}. ` +
        "Make sure the Docker container is running: docker compose up -d",
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new AnkiServiceError(
      res.status,
      (body as { detail?: string }).detail ?? res.statusText,
    );
  }

  return res.json() as Promise<T>;
}

// ─── Exported Functions ───────────────────────────────────────────────────────

export async function getDecks(): Promise<string[]> {
  const data = await request<{ decks: string[] }>("/decks");
  return data.decks;
}

export async function getDueCards(
  deckName: string,
): Promise<{ cards: AnkiCard[]; totalDue: number; ratedToday: number }> {
  return request<{ cards: AnkiCard[]; totalDue: number; ratedToday: number }>("/cards", {
    method: "POST",
    body: JSON.stringify({ deck_name: deckName }),
  });
}

export async function answerCard(
  cardId: number,
  ease: AnkiEase,
): Promise<{ success: boolean; newInterval: number; newEase: number; newDue: number }> {
  return request("/answer", {
    method: "POST",
    body: JSON.stringify({ card_id: cardId, ease }),
  });
}

export interface AddNotePayload {
  deckName: string;
  front: string;
  back: string;
  tags?: string[];
}

export async function addNote(
  payload: AddNotePayload,
): Promise<{ noteId: number; success: boolean }> {
  return request("/add-note", {
    method: "POST",
    body: JSON.stringify({
      deck_name: payload.deckName,
      front: payload.front,
      back: payload.back,
      tags: payload.tags ?? [],
    }),
  });
}

export async function syncCollection(
  username: string,
  password: string,
): Promise<{ success: boolean }> {
  return request("/sync", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export { AnkiServiceError };
