import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbPath = process.env.APP_DB_PATH ?? "./data/language-learner.db";

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
