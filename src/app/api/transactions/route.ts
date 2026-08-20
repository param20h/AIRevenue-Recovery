import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { transactions, customers } from '../../../db/schema';
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

  return NextResponse.json({ transactions: txs });
}
