"use client";

import { useEffect, useState, Suspense } from "react";
import { DoubleBezelCard } from "../../../components/ui/DoubleBezelCard";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldWarning } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";

function TransactionsList() {
  const searchParams = useSearchParams();
  const filterBlocked = searchParams.get('blocked') === 'true';
  const [txs, setTxs] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/transactions").then(r => r.json()).then(d => setTxs(d.transactions));
    fetch("/api/audit").then(r => r.json()).then(d => setAudits(d.audits));
  }, []);

  const blockedTxIds = new Set(audits.filter(a => a.actionBlocked).map(a => a.transactionId));
  const filteredTxs = filterBlocked ? txs.filter(t => blockedTxIds.has(t.id)) : txs;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl font-medium tracking-tight text-black dark:text-white">Transactions</h1>
          <p className="text-black/60 dark:text-white/40 max-w-xl">Every payment event and invoice processed through the dual-pipeline state machine.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/transactions" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!filterBlocked ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-black/5 text-black hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'}`}>
            All
          </Link>
          <Link href="/dashboard/transactions?blocked=true" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${filterBlocked ? 'bg-amber-500 text-white dark:text-black' : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-500'}`}>
            <ShieldWarning size={16} />
            Guardrail Blocks
          </Link>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}>
        <DoubleBezelCard innerClassName="p-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-xs uppercase tracking-wider text-black/50 dark:text-white/40">
                  <th className="p-4 font-medium">Tx ID</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Failure Reason</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm text-black dark:text-white">
                {filteredTxs.map(tx => (
                  <tr key={tx.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => window.location.href = `/dashboard/transaction/${tx.id}`}>
                    <td className="p-4 font-mono text-black/60 dark:text-white/60">{tx.id.split('_').pop()}</td>
                    <td className="p-4 capitalize">{tx.type}</td>
                    <td className="p-4 font-medium">{tx.customerName}</td>
                    <td className="p-4 text-black/60 dark:text-white/60">{tx.failureReason?.replace('_', ' ')}</td>
                    <td className="p-4">
                      {blockedTxIds.has(tx.id) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500 text-xs font-medium border border-amber-500/20">
                          <ShieldWarning size={14} /> BLOCKED
                        </span>
                      ) : (
                        <span className="capitalize text-black/60 dark:text-white/60">{tx.status}</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-medium">{(tx.amount / 100).toFixed(2)} {tx.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DoubleBezelCard>
      </motion.div>
    </div>
  );
}

export default function TransactionsDashboard() {
  return (
    <Suspense fallback={<div className="animate-pulse h-[60vh] flex items-center justify-center text-black/40 dark:text-white/40">Loading Transactions...</div>}>
      <TransactionsList />
    </Suspense>
  );
}
