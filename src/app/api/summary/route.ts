export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { transactions, agentDecisions } from '../../../db/schema';

export async function GET() {
  try {
    const allTxs = await db.query.transactions.findMany();
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

    // Failure reason breakdown
    const reasonMap: Record<string, { count: number; amount: number }> = {};
    for (const tx of pendingOrFailed) {
      const key = tx.failureReason || 'unknown';
      if (!reasonMap[key]) reasonMap[key] = { count: 0, amount: 0 };
      reasonMap[key].count++;
      reasonMap[key].amount += tx.amount / 100;
    }
    const failureBreakdown = Object.entries(reasonMap).map(([reason, data]) => ({
      reason: reason.replace(/_/g, ' '),
      ...data,
    })).sort((a, b) => b.count - a.count);

    // Promises to pay
    const promiseAudits = allAudits.filter(a => a.actionTaken === 'PROMISE_TO_PAY' && !a.actionBlocked);
    const promisesToPay = promiseAudits.map(a => {
      let promisedPayDate: string | null = null;
      try {
        const parsed = JSON.parse(a.outcome || '{}');
        promisedPayDate = parsed.promisedPayDate || null;
      } catch { }
      return { transactionId: a.transactionId, promisedPayDate };
    });

    return NextResponse.json({
      revenueAtRisk,
      recovered,
      recoveryRate,
      pipelineSplit,
      guardrailBlocks,
      failureBreakdown,
      promisesToPay,
    });
  } catch (error: any) {
    console.error("Summary API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
