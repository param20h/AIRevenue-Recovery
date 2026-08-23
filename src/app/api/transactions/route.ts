export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { transactions, customers, agentDecisions } from '../../../db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  
  let txs = await db.select({
    id: transactions.id,
    type: transactions.type,
    amount: transactions.amount,
    currency: transactions.currency,
    failureReason: transactions.failureReason,
    status: transactions.status,
    createdAt: transactions.createdAt,
    customerId: customers.id,
    customerName: customers.name,
  })
  .from(transactions)
  .leftJoin(customers, eq(transactions.customerId, customers.id))
  .orderBy(desc(transactions.createdAt));

  if (type) {
    txs = txs.filter(t => t.type === type);
  }

  // Fetch all agent decisions to compute the blocked flag + block reason per transaction
  const decisions = await db.select({
    transactionId: agentDecisions.transactionId,
    actionBlocked: agentDecisions.actionBlocked,
    blockReason: agentDecisions.blockReason,
    actionTaken: agentDecisions.actionTaken,
    timestamp: agentDecisions.timestamp,
  }).from(agentDecisions).orderBy(desc(agentDecisions.timestamp));

  // For each tx, find the most recent blocked decision
  const blockedMap = new Map<string, { blockReason: string | null, actionTaken: string | null }>();
  for (const d of decisions) {
    if (d.actionBlocked && !blockedMap.has(d.transactionId)) {
      blockedMap.set(d.transactionId, { blockReason: d.blockReason, actionTaken: d.actionTaken });
    }
  }

  const enriched = txs.map(tx => ({
    ...tx,
    blocked: blockedMap.has(tx.id),
    blockReason: blockedMap.get(tx.id)?.blockReason ?? null,
    blockedAction: blockedMap.get(tx.id)?.actionTaken ?? null,
  }));

  return NextResponse.json({ transactions: enriched });
}
