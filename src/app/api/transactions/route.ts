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

  // Fetch all agent decisions to compute the blocked flag per transaction
  const decisions = await db.select({
    transactionId: agentDecisions.transactionId,
    actionBlocked: agentDecisions.actionBlocked,
  }).from(agentDecisions);

  // Build a set of blocked transaction IDs
  const blockedTxIds = new Set(
    decisions.filter(d => d.actionBlocked).map(d => d.transactionId)
  );

  const enriched = txs.map(tx => ({
    ...tx,
    blocked: blockedTxIds.has(tx.id),
  }));

  return NextResponse.json({ transactions: enriched });
}
