"use client";

import { useEffect, useState } from "react";
import { DoubleBezelCard } from "../../../components/ui/DoubleBezelCard";
import { motion, AnimatePresence } from "framer-motion";
import { Warning, CheckCircle, ClockCounterClockwise, ShieldWarning, CircleNotch, Info } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function BlockedTooltip({ reason, action }: { reason: string | null, action: string | null }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info size={12} className="text-amber-500 ml-1 cursor-help" />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 p-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs shadow-2xl"
          >
            <p className="font-bold font-mono mb-1 text-amber-400 dark:text-amber-600">{action} → BLOCKED</p>
            <p className="opacity-80 leading-relaxed">{reason || 'Guardrail rule triggered.'}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black dark:border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default function TransactionsList() {
  const [txs, setTxs] = useState<any[]>([]);
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('blocked') === 'true') setShowBlockedOnly(true);
    fetch("/api/transactions")
      .then(r => r.json())
      .then(data => setTxs(Array.isArray(data) ? data : (data.transactions ?? [])))
      .catch(() => setTxs([]));
  }, []);

  if (txs.length === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-black/40 dark:text-white/40 gap-4">
       <CircleNotch className="animate-spin text-black/20 dark:text-white/20" size={32} />
       <span className="font-mono text-xs tracking-widest uppercase">Fetching Ledger...</span>
    </div>
  );

  const filtered = showBlockedOnly ? txs.filter(t => t.blocked) : txs;

  const getStatusIcon = (status: string, blocked: boolean) => {
    if (blocked) return <ShieldWarning size={16} className="text-amber-500" weight="fill" />;
    if (status === 'closed' || status === 'recovered') return <CheckCircle size={16} className="text-emerald-500" weight="fill" />;
    if (status === 'pending') return <ClockCounterClockwise size={16} className="text-blue-500" />;
    return <Warning size={16} className="text-rose-500" weight="fill" />;
  };

  const getStatusDisplay = (status: string, blocked: boolean) => {
    if (blocked) return "BLOCKED";
    if (status === 'failed') return "FAILED";
    if (status === 'overdue') return "OVERDUE";
    if (status === 'pending') return "PENDING";
    if (status === 'recovered') return "RECOVERED";
    if (status === 'closed') return "CLOSED";
    return status.toUpperCase();
  };

  const getStatusColors = (status: string, blocked: boolean) => {
    if (blocked) return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
    if (status === 'closed' || status === 'recovered') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    if (status === 'failed') return 'bg-rose-500/10 text-rose-700 dark:text-rose-400';
    if (status === 'overdue') return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    if (status === 'pending') return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    return 'bg-black/5 text-black/60 dark:bg-white/5 dark:text-white/60';
  };

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-light tracking-tight text-black dark:text-white">Ledger</motion.h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBlockedOnly(false)} className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors ${!showBlockedOnly ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-black/5 text-black/50 hover:bg-black/10 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10'}`}>
            All Events
          </button>
          <button onClick={() => setShowBlockedOnly(true)} className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 ${showBlockedOnly ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20' : 'bg-black/5 text-black/50 hover:bg-black/10 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10'}`}>
            <ShieldWarning size={14} weight="fill" /> Guardrail Blocks
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <DoubleBezelCard innerClassName="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-black/40 dark:text-white/40">
                  <th className="p-6 font-semibold">Tx ID</th>
                  <th className="p-6 font-semibold">Type</th>
                  <th className="p-6 font-semibold">Customer</th>
                  <th className="p-6 font-semibold">Failure Reason</th>
                  <th className="p-6 font-semibold">Status</th>
                  <th className="p-6 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors group text-black dark:text-white">
                    <td className="p-6 font-mono opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => router.push(`/dashboard/transaction/${tx.id}`)}>
                      {tx.id.split('_').pop()}
                    </td>
                    <td className="p-6 capitalize opacity-80" onClick={() => router.push(`/dashboard/transaction/${tx.id}`)} style={{cursor:'pointer'}}>{tx.type}</td>
                    <td className="p-6">
                      <Link href={`/dashboard/customer/${tx.customerId}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium hover:underline underline-offset-2" onClick={e => e.stopPropagation()}>
                        {tx.customerName}
                      </Link>
                    </td>
                    <td className="p-6 capitalize opacity-60" onClick={() => router.push(`/dashboard/transaction/${tx.id}`)} style={{cursor:'pointer'}}>{tx.failureReason?.replace(/_/g, ' ')}</td>
                    <td className="p-6" onClick={() => !tx.blocked && router.push(`/dashboard/transaction/${tx.id}`)} style={{cursor:'pointer'}}>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${getStatusColors(tx.status, tx.blocked)}`}>
                        {getStatusIcon(tx.status, tx.blocked)}
                        {getStatusDisplay(tx.status, tx.blocked)}
                        {tx.blocked && <BlockedTooltip reason={tx.blockReason} action={tx.blockedAction} />}
                      </div>
                    </td>
                    <td className="p-6 text-right font-mono opacity-80" onClick={() => router.push(`/dashboard/transaction/${tx.id}`)} style={{cursor:'pointer'}}>{(tx.amount / 100).toFixed(2)} {tx.currency}</td>
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
