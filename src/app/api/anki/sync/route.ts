import { NextRequest, NextResponse } from "next/server";
import { syncCollection, AnkiServiceError } from "@/lib/anki-service-client";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = (await req.json()) as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password are required" },
        { status: 400 },
      );
    }

    const result = await syncCollection(username, password);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnkiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
