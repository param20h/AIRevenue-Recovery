import { db } from "../../db/client";
import { agentDecisions, customers, transactions } from "../../db/schema";
import { runGuardrails } from "../guardrail";
import { eq } from "drizzle-orm";
import { CustomerContext, TransactionContext, PipelineType } from "../types";
import { v4 as uuidv4 } from "uuid";

export async function runReceivablesPipeline(transactionId: string) {
  const txRecord = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  if (!txRecord || txRecord.status === 'closed') {
    throw new Error('Transaction not found or already closed');
  }

  const customerRecord = await db.query.customers.findFirst({
    where: eq(customers.id, txRecord.customerId),
  });

  if (!customerRecord) throw new Error('Customer not found');

  // Calculate days overdue
  const daysOverdue = txRecord.dueDate
    ? Math.floor((Date.now() - new Date(txRecord.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 2;

  const txContext: TransactionContext = {
    id: txRecord.id,
    amount: txRecord.amount,
    failureReason: 'overdue_invoice',
    attemptCount: 0,
  };

  const customerContext: CustomerContext = {
    id: customerRecord.id,
    optOut: customerRecord.optOut,
    priorSuccessfulPayments: customerRecord.priorSuccessfulPayments,
    lastContactAt: customerRecord.lastContactAt,
    dailyContactCount: customerRecord.dailyContactCount,
    contactCountResetAt: customerRecord.contactCountResetAt,
  };

  // Strategy: High-value invoices (>₹1000) → PROMISE_TO_PAY, others → WHATSAPP_REMINDER
  const proposedAction = txRecord.amount > 100000 ? 'PROMISE_TO_PAY' : 'WHATSAPP_REMINDER';

  const guardrailResults = runGuardrails(customerContext, txContext, proposedAction);
  const actionBlocked = guardrailResults.some(r => !r.passed);
  const blockReason = guardrailResults.find(r => !r.passed)?.reason || null;

  const finalAction = actionBlocked ? 'NO_ACTION' : proposedAction;

  // If Promise-to-Pay, log a promised date 7 days from now
  const promisedPayDate = finalAction === 'PROMISE_TO_PAY'
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const auditId = uuidv4();
  await db.insert(agentDecisions).values({
    id: auditId,
    transactionId: txRecord.id,
    pipeline: 'receivables' as PipelineType,
    stateFrom: 'overdue',
    stateTo: finalAction === 'PROMISE_TO_PAY' ? 'promise_requested' : 'chaser_sent',
    timestamp: new Date(),
    inputSignals: JSON.stringify({
      days_overdue: daysOverdue,
      amount: txRecord.amount,
      strategy: proposedAction,
    }),
    guardrailResults: JSON.stringify(guardrailResults),
    actionTaken: finalAction,
    actionBlocked,
    blockReason,
    outcome: promisedPayDate ? JSON.stringify({ promisedPayDate }) : 'pending',
  });

  let newStatus = txRecord.status;
  if (actionBlocked || finalAction === 'NO_ACTION') {
    newStatus = 'closed';
  } else {
    newStatus = 'pending';
    await db.update(customers)
      .set({ lastContactAt: new Date(), dailyContactCount: (customerRecord.dailyContactCount || 0) + 1 })
      .where(eq(customers.id, customerRecord.id));
  }

  await db.update(transactions)
    .set({ status: newStatus })
    .where(eq(transactions.id, txRecord.id));

  return {
    auditId,
    actionTaken: finalAction,
    actionBlocked,
    blockReason,
    promisedPayDate,
  };
}
