import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";
import * as schema from "./schema";

const dbPath = process.env.APP_DB_PATH ?? "./data/language-learner.db";

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

// Run migrations automatically — creates tables if they don't exist yet
const migrationsFolder = path.join(process.cwd(), "drizzle");
migrate(db, { migrationsFolder }).catch((err) => {
  console.error("DB migration failed:", err);
});

export type Database = typeof db;
