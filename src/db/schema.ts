import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  optOut: integer("opt_out", { mode: "boolean" }).notNull().default(false),
  priorSuccessfulPayments: integer("prior_successful_payments").notNull().default(0),
  lastContactAt: integer("last_contact_at", { mode: "timestamp" }),
  dailyContactCount: integer("daily_contact_count").notNull().default(0),
  contactCountResetAt: integer("contact_count_reset_at", { mode: "timestamp" }),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'payment' | 'invoice'
  customerId: text("customer_id").notNull().references(() => customers.id),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  failureReason: text("failure_reason"), // e.g., 'bank_timeout', 'insufficient_funds', 'abandoned_checkout', etc.
  status: text("status").notNull(), // 'failed', 'recovered', 'overdue', 'pending', 'closed'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }), // for invoices
});

export const agentDecisions = sqliteTable("agent_decisions", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id").notNull().references(() => transactions.id),
  pipeline: text("pipeline").notNull(), // 'payment' | 'receivables'
  stateFrom: text("state_from").notNull(),
  stateTo: text("state_to").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  inputSignals: text("input_signals"), // JSON string
  guardrailResults: text("guardrail_results"), // JSON string
  actionTaken: text("action_taken"),
  actionBlocked: integer("action_blocked", { mode: "boolean" }).notNull().default(false),
  blockReason: text("block_reason"),
  outcome: text("outcome"),
});
