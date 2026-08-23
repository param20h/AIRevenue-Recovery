export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { transactions, customers, agentDecisions } from '../../../db/schema';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // Make sure tables exist for serverless Vercel environments that use /tmp
    await db.run(sql`
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
    
    await db.run(sql`
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
    
    await db.run(sql`
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

    // Clear existing data
    await db.run(sql`DELETE FROM agent_decisions`);
    await db.run(sql`DELETE FROM transactions`);
    await db.run(sql`DELETE FROM customers`);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const customerData = [
      { id: "cus_regular", name: "Acme Corp", email: "billing@acme.com", priorSuccessfulPayments: 2 },
      { id: "cus_high_value", name: "Global Tech", email: "finance@globaltech.io", priorSuccessfulPayments: 15 },
      { id: "cus_first_time", name: "New Startup", email: "founder@newstartup.co", priorSuccessfulPayments: 0 },
      { id: "cus_opt_out", name: "Privacy Co", email: "hello@privacyco.net", priorSuccessfulPayments: 5, optOut: true },
      { id: "cus_retry_cap", name: "Stubborn Payer", email: "stubborn@payer.org", priorSuccessfulPayments: 1 }
    ];
    await db.insert(customers).values(customerData);

    const txData = [
      { id: "tx_succ_01", type: "payment", customerId: "cus_regular", amount: 15000, status: "closed", createdAt: yesterday },
      { id: "tx_fail_timeout", type: "payment", customerId: "cus_regular", amount: 5000, failureReason: "bank_timeout", status: "failed", createdAt: now },
      { id: "tx_fail_funds", type: "payment", customerId: "cus_regular", amount: 12000, failureReason: "insufficient_funds", status: "failed", createdAt: now },
      { id: "tx_abandoned", type: "payment", customerId: "cus_high_value", amount: 99000, failureReason: "abandoned_checkout", status: "failed", createdAt: now },
      { id: "tx_fail_opt_out", type: "payment", customerId: "cus_opt_out", amount: 2500, failureReason: "gateway_error", status: "failed", createdAt: now },
      { id: "tx_retry_cap", type: "payment", customerId: "cus_retry_cap", amount: 19000, failureReason: "bank_timeout", status: "failed", createdAt: now },
      { id: "inv_overdue_01", type: "invoice", customerId: "cus_regular", amount: 500000, status: "overdue", createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
    ];
    await db.insert(transactions).values(txData);

    const prevDecisions = [];
    for(let i=0; i<3; i++) {
      prevDecisions.push({
        id: `aud_seed_retry_${i}`,
        transactionId: "tx_retry_cap",
        pipeline: "payment",
        stateFrom: "strategy_selected",
        stateTo: "action_executed",
        timestamp: new Date(now.getTime() - (3-i) * 60 * 60 * 1000),
        inputSignals: JSON.stringify({ failure_reason: "bank_timeout", attempt_count: i }),
        guardrailResults: JSON.stringify([{ rule: "MAX_RETRIES", passed: true }]),
        actionTaken: "AUTO_RETRY",
        actionBlocked: false,
        outcome: "failed"
      });
    }
    await db.insert(agentDecisions).values(prevDecisions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
