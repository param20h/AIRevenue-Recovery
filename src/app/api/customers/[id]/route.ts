export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../../db/client';
import { transactions, customers, agentDecisions } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, id),
  });

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const txs = await db.select().from(transactions)
    .where(eq(transactions.customerId, id))
    .orderBy(desc(transactions.createdAt));

  const decisions = await db.select().from(agentDecisions)
    .orderBy(desc(agentDecisions.timestamp));

  const txIds = new Set(txs.map(t => t.id));
  const custDecisions = decisions.filter(d => txIds.has(d.transactionId));

  const totalContacted = custDecisions.filter(d => !d.actionBlocked).length;
  const totalBlocked = custDecisions.filter(d => d.actionBlocked).length;
  const totalRecovered = txs.filter(t => t.status === 'recovered' || t.status === 'closed').length;
  const lastContactAt = customer.lastContactAt;

  // Compute risk tier
  let riskTier = 'LOW';
  if (customer.optOut) riskTier = 'OPT_OUT';
  else if (customer.priorSuccessfulPayments === 0) riskTier = 'HIGH';
  else if (customer.priorSuccessfulPayments < 3) riskTier = 'MEDIUM';

  return NextResponse.json({
    customer: {
      ...customer,
      riskTier,
      totalContacted,
      totalBlocked,
      totalRecovered,
    },
    transactions: txs,
    decisions: custDecisions,
  });
}
