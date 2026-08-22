import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Vercel environment injects VERCEL=1
// If we are on Vercel, we MUST use /tmp because the rest of the filesystem is read-only
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? '/tmp/sqlite.db' : 'sqlite.db';

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
