import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.airevenue_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || 'file:sqlite.db',
  authToken: process.env.airevenue_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
