export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { transactions } from '../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { runPaymentPipeline } from '../../../engine/pipelines/payment';
import { runReceivablesPipeline } from '../../../engine/pipelines/receivables';

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Ignore empty body
    }

    const { transactionId } = body;

    if (transactionId) {
      const tx = await db.query.transactions.findFirst({
        where: eq(transactions.id, transactionId)
      });
      if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      if (tx.type === 'payment') {
        const result = await runPaymentPipeline(tx.id);
        return NextResponse.json({ success: true, ...result });
      } else {
        const result = await runReceivablesPipeline(tx.id);
        return NextResponse.json({ success: true, ...result });
      }
    }

    // Run on all failed/overdue that aren't closed
    const pendingTxs = await db.select().from(transactions).where(inArray(transactions.status, ['failed', 'overdue']));

    const results = [];
    for (const tx of pendingTxs) {
      if (tx.type === 'payment') {
        results.push(await runPaymentPipeline(tx.id));
      } else {
        results.push(await runReceivablesPipeline(tx.id));
      }
    }

    return NextResponse.json({ success: true, runCount: results.length, results });
  } catch (error: any) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
