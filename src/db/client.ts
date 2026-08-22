import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

// Vercel environment injects VERCEL=1
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? '/tmp/sqlite.db' : 'sqlite.db';

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Auto-migrate in serverless environments to prevent "no such table" 500 errors
try {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      opt_out INTEGER NOT NULL DEFAULT 0,
      prior_successful_payments INTEGER NOT NULL DEFAULT 0,
      last_contact_at INTEGER,
      daily_contact_count INTEGER NOT NULL DEFAULT 0,
      contact_count_reset_at INTEGER
    );
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      failure_reason TEXT,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      due_date INTEGER
    );
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS agent_decisions (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      pipeline TEXT NOT NULL,
      state_from TEXT NOT NULL,
      state_to TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      input_signals TEXT,
      guardrail_results TEXT,
      action_taken TEXT,
      action_blocked INTEGER NOT NULL DEFAULT 0,
      block_reason TEXT,
      outcome TEXT
    );
  `);
} catch (e) {
  console.error("Failed to auto-migrate schema:", e);
}
