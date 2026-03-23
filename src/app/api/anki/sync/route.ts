import { NextResponse } from "next/server";
import { syncCollection, AnkiServiceError } from "@/lib/anki-service-client";

export async function POST() {
  try {
    const result = await syncCollection();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnkiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
