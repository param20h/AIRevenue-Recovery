export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { agentDecisions } from '../../../db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('transactionId');
  const blocked = searchParams.get('blocked');

  const conditions = [];
  if (transactionId) conditions.push(eq(agentDecisions.transactionId, transactionId));
  if (blocked === 'true') conditions.push(eq(agentDecisions.actionBlocked, true));

  const audits = await db.query.agentDecisions.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(agentDecisions.timestamp)]
  });

  return NextResponse.json({ audits });
}
