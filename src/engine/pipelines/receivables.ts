import { db } from "../../db/client";
import { agentDecisions, customers, transactions } from "../../db/schema";
import { runGuardrails } from "../guardrail";
import { eq, desc } from "drizzle-orm";
import { CustomerContext, TransactionContext, PipelineType } from "../types";
import { v4 as uuidv4 } from "uuid";

export async function runReceivablesPipeline(transactionId: string) {
  // Stub for Receivables Pipeline
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

  const txContext: TransactionContext = {
    id: txRecord.id,
    amount: txRecord.amount,
    failureReason: 'unknown',
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

  // Default action for overdue stub
  const proposedAction = 'WHATSAPP_REMINDER'; 
  
  const guardrailResults = runGuardrails(customerContext, txContext, proposedAction);
  const actionBlocked = guardrailResults.some(r => !r.passed);
  const blockReason = guardrailResults.find(r => !r.passed)?.reason || null;

  const finalAction = actionBlocked ? 'NO_ACTION' : proposedAction;

  const auditId = uuidv4();
  await db.insert(agentDecisions).values({
    id: auditId,
    transactionId: txRecord.id,
    pipeline: 'receivables' as PipelineType,
    stateFrom: 'overdue',
    stateTo: 'chaser_sent',
    timestamp: new Date(),
    inputSignals: JSON.stringify({
      days_overdue: 2,
    }),
    guardrailResults: JSON.stringify(guardrailResults),
    actionTaken: finalAction,
    actionBlocked,
    blockReason,
    outcome: 'pending'
  });

  return {
    auditId,
    actionTaken: finalAction,
    actionBlocked,
    blockReason
  };
}
