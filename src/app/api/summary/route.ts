export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { transactions, agentDecisions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    let allTxs = await db.query.transactions.findMany();
    
    // Hackathon failsafe: If the ephemeral Vercel DB is completely empty, auto-seed it!
    if (allTxs.length === 0 && process.env.VERCEL === '1') {
      const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      await fetch(`${host}/api/reset`, { method: 'POST' }).catch(() => {});
      allTxs = await db.query.transactions.findMany();
    }

    const allAudits = await db.query.agentDecisions.findMany();

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
