import { db } from "../db/client";
import { customers, transactions, agentDecisions } from "../db/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  db.run(sql`DELETE FROM agent_decisions`);
  db.run(sql`DELETE FROM transactions`);
  db.run(sql`DELETE FROM customers`);

  // 1. Customers
  const customerData = [
    {
      id: "cus_regular",
      name: "Acme Corp",
      email: "billing@acme.com",
      priorSuccessfulPayments: 2,
    },
    {
      id: "cus_high_value",
      name: "Global Tech",
      email: "finance@globaltech.io",
      priorSuccessfulPayments: 15, // High value
    },
    {
      id: "cus_first_time",
      name: "New Startup",
      email: "founder@newstartup.co",
      priorSuccessfulPayments: 0,
    },
    {
      id: "cus_opt_out",
      name: "Privacy Co",
      email: "hello@privacyco.net",
      priorSuccessfulPayments: 5,
      optOut: true, // Guardrail test: opted out
    },
    {
      id: "cus_retry_cap",
      name: "Stubborn Payer",
      email: "stubborn@payer.org",
      priorSuccessfulPayments: 1,
    }
  ];

  await db.insert(customers).values(customerData);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // 2. Transactions
  const txData = [
    // Successful context (Noise)
    {
      id: "tx_succ_01",
      type: "payment",
      customerId: "cus_regular",
      amount: 15000, // 150.00
      status: "closed",
      createdAt: yesterday,
    },
    
    // Bank timeout (Should retry)
    {
      id: "tx_fail_timeout",
      type: "payment",
      customerId: "cus_regular",
      amount: 5000,
      failureReason: "bank_timeout",
      status: "failed",
      createdAt: now,
    },
    
    // Insufficient funds (No retry, maybe payment link)
    {
      id: "tx_fail_funds",
      type: "payment",
      customerId: "cus_regular",
      amount: 12000,
      failureReason: "insufficient_funds",
      status: "failed",
      createdAt: now,
    },
    
    // Abandoned checkout (WhatsApp reminder)
    {
      id: "tx_abandoned",
      type: "payment",
      customerId: "cus_high_value",
      amount: 99000,
      failureReason: "abandoned_checkout",
      status: "failed",
      createdAt: now,
    },
    
    // Guardrail: Opt-out (Should block)
    {
      id: "tx_fail_opt_out",
      type: "payment",
      customerId: "cus_opt_out",
      amount: 2500,
      failureReason: "gateway_error",
      status: "failed",
      createdAt: now,
    },
    
    // Guardrail: Hit retry cap (3 attempts already done -> blocked)
    {
      id: "tx_retry_cap",
      type: "payment",
      customerId: "cus_retry_cap",
      amount: 19000,
      failureReason: "bank_timeout",
      status: "failed",
      createdAt: now,
    },
    
    // Receivables Pipeline: Overdue Invoice
    {
      id: "inv_overdue_01",
      type: "invoice",
      customerId: "cus_regular",
      amount: 500000,
      status: "overdue",
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days overdue
    }
  ];

  await db.insert(transactions).values(txData);

  // 3. Pre-seed the retry cap transaction with 3 prior decisions
  const prevDecisions = [];
  for(let i=0; i<3; i++) {
    prevDecisions.push({
      id: `aud_seed_retry_${i}`,
      transactionId: "tx_retry_cap",
      pipeline: "payment",
      stateFrom: "strategy_selected",
      stateTo: "action_executed",
      timestamp: new Date(now.getTime() - (3-i) * 60 * 60 * 1000), // Hours ago
      inputSignals: JSON.stringify({ failure_reason: "bank_timeout", attempt_count: i }),
      guardrailResults: JSON.stringify([{ rule: "MAX_RETRIES", passed: true }]),
      actionTaken: "AUTO_RETRY",
      actionBlocked: false,
      outcome: "failed"
    });
  }

  await db.insert(agentDecisions).values(prevDecisions);

  console.log("✅ Seeding complete.");
}

seed().catch(console.error);
