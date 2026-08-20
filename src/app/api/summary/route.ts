import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { transactions, agentDecisions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const allTxs = await db.query.transactions.findMany();
  const allAudits = await db.query.agentDecisions.findMany();

  const atRisk = allTxs
    .filter(t => t.status === 'failed' || t.status === 'overdue' || t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const recovered = allTxs
    .filter(t => t.status === 'recovered')
    .reduce((sum, t) => sum + t.amount, 0);

  const guardrailBlocks = allAudits.filter(a => a.actionBlocked).length;
  
  const paymentCount = allTxs.filter(t => t.type === 'payment').length;
  const receivablesCount = allTxs.filter(t => t.type === 'invoice').length;

  return NextResponse.json({
    revenueAtRisk: atRisk,
    recovered,
    recoveryRate: (recovered / (atRisk + recovered) * 100) || 0,
    guardrailBlocks,
    pipelineSplit: { payment: paymentCount, receivables: receivablesCount }
  });
}
