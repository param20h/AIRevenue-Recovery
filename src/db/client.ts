import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

// In Vercel (production), the filesystem is read-only except for /tmp
const isProd = process.env.NODE_ENV === 'production';
const dbPath = isProd ? '/tmp/sqlite.db' : 'sqlite.db';

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
