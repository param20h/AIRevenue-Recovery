export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { transactions, agentDecisions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    let allTxs: any[] = [];
    let allAudits: any[] = [];

    try {
      allTxs = await db.query.transactions.findMany();
      allAudits = await db.query.agentDecisions.findMany();
    } catch (e: any) {
      // If tables don't exist yet, just return 0s so the dashboard loads cleanly!
      if (e.message && e.message.includes('no such table')) {
        return NextResponse.json({
          revenueAtRisk: 0,
          recovered: 0,
          recoveryRate: 0,
          pipelineSplit: { payment: 0, receivables: 0 },
          guardrailBlocks: 0,
          requiresReset: true
        });
      }
      throw e;
    }

    const pendingOrFailed = allTxs.filter(t => t.status === 'failed' || t.status === 'pending' || t.status === 'overdue');
    const revenueAtRisk = pendingOrFailed.reduce((sum, t) => sum + t.amount, 0) / 100;
    
    const recoveredTxs = allTxs.filter(t => t.status === 'recovered' || t.status === 'closed');
    const recovered = recoveredTxs.reduce((sum, t) => sum + t.amount, 0) / 100;

    const pipelineSplit = {
      payment: pendingOrFailed.filter(t => t.type === 'payment').length,
      receivables: pendingOrFailed.filter(t => t.type === 'invoice').length,
    };

    const guardrailBlocks = allAudits.filter(a => a.actionBlocked).length;
    
    const totalValue = revenueAtRisk + recovered;
    const recoveryRate = totalValue > 0 ? (recovered / totalValue) * 100 : 0;

    return NextResponse.json({
      revenueAtRisk,
      recovered,
      recoveryRate,
      pipelineSplit,
      guardrailBlocks
    });
  } catch (error: any) {
    console.error("Summary API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
