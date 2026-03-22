import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

const SETTING_KEYS = ["ankiDbPath", "language"] as const;

export async function GET() {
  try {
    const rows = await db.select().from(settings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return NextResponse.json({ settings: result });
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, string>;

    for (const key of SETTING_KEYS) {
      if (key in body && body[key] !== undefined) {
        await db
          .insert(settings)
          .values({ key, value: body[key] })
          .onConflictDoUpdate({ target: settings.key, set: { value: body[key] } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
