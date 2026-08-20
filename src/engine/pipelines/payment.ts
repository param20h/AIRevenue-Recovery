import { db } from "../../db/client";
import { agentDecisions, customers, transactions } from "../../db/schema";
import { calculateScore } from "../scoring";
import { selectStrategy } from "../strategy";
import { runGuardrails } from "../guardrail";
import { eq, desc } from "drizzle-orm";
import { CustomerContext, TransactionContext, FailureReason, PipelineType } from "../types";
import { v4 as uuidv4 } from "uuid";

export async function runPaymentPipeline(transactionId: string) {
  // --- 1. DETECTED ---
  const txRecord = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  if (!txRecord || txRecord.status === 'closed') {
    throw new Error('Transaction not found or already closed');
  }

  // --- 2. DIAGNOSED ---
  const customerRecord = await db.query.customers.findFirst({
    where: eq(customers.id, txRecord.customerId),
  });

  if (!customerRecord) throw new Error('Customer not found');

  // Calculate attempt count from audit ledger
  const previousDecisions = await db.query.agentDecisions.findMany({
    where: eq(agentDecisions.transactionId, transactionId),
    orderBy: [desc(agentDecisions.timestamp)],
  });
  
  const attemptCount = previousDecisions.filter(d => d.actionTaken && d.actionTaken !== 'NO_ACTION' && !d.actionBlocked).length;

  const txContext: TransactionContext = {
    id: txRecord.id,
    amount: txRecord.amount,
    failureReason: (txRecord.failureReason as FailureReason) || 'unknown',
    attemptCount,
  };

  const customerContext: CustomerContext = {
    id: customerRecord.id,
    optOut: customerRecord.optOut,
    priorSuccessfulPayments: customerRecord.priorSuccessfulPayments,
    lastContactAt: customerRecord.lastContactAt,
    dailyContactCount: customerRecord.dailyContactCount,
    contactCountResetAt: customerRecord.contactCountResetAt,
  };

  // --- 3. SCORED ---
  const score = calculateScore(txContext, customerContext);

  // --- 4. STRATEGY_SELECTED ---
  const proposedAction = selectStrategy(score, txContext.failureReason, attemptCount, txContext.amount);

  // --- 5. GUARDRAIL_CHECKED ---
  const guardrailResults = runGuardrails(customerContext, txContext, proposedAction);
  const actionBlocked = guardrailResults.some(r => !r.passed);
  const blockReason = guardrailResults.find(r => !r.passed)?.reason || null;

  // --- 6. ACTION_EXECUTED (or blocked) ---
  const finalAction = actionBlocked ? 'NO_ACTION' : proposedAction;
  
  let newStatus = txRecord.status;
  let outcome = null;

  if (actionBlocked || finalAction === 'NO_ACTION') {
    newStatus = 'closed'; // Stop pipeline
    outcome = 'failed';
  } else {
    newStatus = 'pending'; // Waiting for outcome
    outcome = 'pending';
    
    // In a real system, we'd fire external APIs here (Stripe retry, Twilio SMS).
    // Update contact timestamps if contact action
    if (finalAction === 'SMART_PAYMENT_LINK' || finalAction === 'WHATSAPP_REMINDER') {
      await db.update(customers)
        .set({ 
          lastContactAt: new Date(),
          dailyContactCount: customerContext.dailyContactCount + 1,
          contactCountResetAt: customerContext.contactCountResetAt || new Date()
        })
        .where(eq(customers.id, customerContext.id));
    }
  }

  // --- 7. OUTCOME_TRACKED & AUDIT WRITE ---
  // We write ONE comprehensive row for the whole decision cycle for simplicity in the demo
  const auditId = uuidv4();
  await db.insert(agentDecisions).values({
    id: auditId,
    transactionId: txRecord.id,
    pipeline: 'payment' as PipelineType,
    stateFrom: 'detected',
    stateTo: newStatus === 'closed' ? 'closed' : 'action_executed',
    timestamp: new Date(),
    inputSignals: JSON.stringify({
      failure_reason: txContext.failureReason,
      score,
      attempt_count: txContext.attemptCount,
      amount: txContext.amount
    }),
    guardrailResults: JSON.stringify(guardrailResults),
    actionTaken: finalAction,
    actionBlocked,
    blockReason,
    outcome
  });

  // Update tx status
  await db.update(transactions)
    .set({ status: newStatus })
    .where(eq(transactions.id, txRecord.id));

  return {
    auditId,
    actionTaken: finalAction,
    actionBlocked,
    blockReason
  };
}
