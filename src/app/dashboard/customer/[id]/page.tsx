"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { DoubleBezelCard } from "../../../../components/ui/DoubleBezelCard";
import { ShieldWarning, CheckCircle, Warning, UserCircle, EnvelopeSimple, Phone, ArrowsClockwise, WhatsappLogo, Link as LinkIcon, CaretRight, CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";

const RiskBadge = ({ tier }: { tier: string }) => {
  const styles: Record<string, string> = {
    OPT_OUT: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    HIGH:    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    MEDIUM:  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    LOW:     'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  };
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full border tracking-widest uppercase ${styles[tier] || styles.LOW}`}>
      {tier === 'OPT_OUT' ? 'Opted Out' : `${tier} Risk`}
    </span>
  );
};

const statusColor = (s: string) => {
  if (s === 'closed' || s === 'recovered') return 'text-emerald-600 dark:text-emerald-400';
  if (s === 'failed') return 'text-rose-600 dark:text-rose-400';
  if (s === 'overdue') return 'text-orange-600 dark:text-orange-400';
  return 'text-blue-600 dark:text-blue-400';
};

export default function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => r.json()).then(setData);
  }, [id]);

  if (!data) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-black/40 dark:text-white/40 gap-4">
      <CircleNotch className="animate-spin" size={28} />
      <span className="font-mono text-xs tracking-widest uppercase">Loading Profile...</span>
    </div>
  );

  const { customer, transactions, decisions } = data;
  const fmt = (amt: number, cur = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(amt / 100);

  return (
    <div className="space-y-12 pb-24 text-black dark:text-white">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] uppercase tracking-[0.2em] font-medium text-black/70 dark:text-white/70">
          <Link href="/dashboard/transactions" className="hover:text-black dark:hover:text-white transition-colors">← Back to Ledger</Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">{customer.name}</h1>
            <p className="text-black/40 dark:text-white/40 font-mono text-sm mt-2">{customer.id}</p>
          </div>
          <RiskBadge tier={customer.riskTier} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Transactions', value: transactions.length },
          { label: 'Agent Contacts', value: customer.totalContacted },
          { label: 'Actions Blocked', value: customer.totalBlocked, accent: customer.totalBlocked > 0 },
          { label: 'Prior Payments', value: customer.priorSuccessfulPayments },
        ].map(({ label, value, accent }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <DoubleBezelCard innerClassName="p-6">
              <p className="text-[10px] font-semibold text-black/40 dark:text-white/30 uppercase tracking-[0.2em] mb-3">{label}</p>
              <p className={`text-4xl font-light tracking-tight ${accent ? 'text-amber-600 dark:text-amber-400' : ''}`}>{value}</p>
            </DoubleBezelCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <DoubleBezelCard innerClassName="p-8 space-y-6">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-black/40 dark:text-white/40">Contact Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EnvelopeSimple size={18} className="text-black/40 dark:text-white/40" />
                <span className="font-mono text-sm">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-black/40 dark:text-white/40" />
                  <span className="font-mono text-sm">{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <UserCircle size={18} className="text-black/40 dark:text-white/40" />
                <span className="text-sm">Opt-Out: <span className={customer.optOut ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>{customer.optOut ? 'YES — Do Not Contact' : 'No'}</span></span>
              </div>
              {customer.lastContactAt && (
                <div className="pt-4 border-t border-black/10 dark:border-white/10">
                  <p className="text-[10px] font-semibold text-black/40 dark:text-white/30 uppercase tracking-[0.2em] mb-1">Last Contacted</p>
                  <p className="font-mono text-sm">{new Date(customer.lastContactAt).toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </DoubleBezelCard>
        </motion.div>

        {/* Transaction History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <DoubleBezelCard innerClassName="p-8">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-black/40 dark:text-white/40 mb-6">Transaction History</h3>
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <Link key={tx.id} href={`/dashboard/transaction/${tx.id}`} className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                  <div>
                    <p className="font-mono text-xs text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white transition-colors">{tx.id}</p>
                    <p className="text-[10px] text-black/40 dark:text-white/30 capitalize mt-0.5">{tx.failureReason?.replace(/_/g, ' ') || tx.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{fmt(tx.amount, tx.currency)}</p>
                    <p className={`text-[10px] uppercase font-bold mt-0.5 ${statusColor(tx.status)}`}>{tx.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          </DoubleBezelCard>
        </motion.div>
      </div>

      {/* Agent Decision History */}
      {decisions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <DoubleBezelCard innerClassName="p-8">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-black/40 dark:text-white/40 mb-6">Agent Interaction Log</h3>
            <div className="space-y-3">
              {decisions.map((d: any) => (
                <div key={d.id} className={`flex items-start gap-4 p-4 rounded-xl border ${d.actionBlocked ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5'}`}>
                  <div className="mt-0.5">
                    {d.actionBlocked ? <ShieldWarning size={16} className="text-amber-500" weight="fill" /> : <CheckCircle size={16} className="text-emerald-500" weight="fill" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-black/50 dark:text-white/40">{new Date(d.timestamp).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-black/30 dark:text-white/30 flex items-center gap-1">{d.stateFrom} <CaretRight size={8} /> {d.stateTo}</span>
                    </div>
                    <p className={`font-mono text-xs mt-1 font-semibold ${d.actionBlocked ? 'text-amber-600 dark:text-amber-400 line-through' : 'text-black dark:text-white'}`}>{d.actionTaken}</p>
                    {d.actionBlocked && d.blockReason && <p className="text-xs text-amber-700 dark:text-amber-400/70 mt-1">{d.blockReason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </DoubleBezelCard>
        </motion.div>
      )}
    </div>
  );
}
