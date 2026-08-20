"use client";

import { useEffect, useState, use } from "react";
import { DoubleBezelCard } from "../../../../components/ui/DoubleBezelCard";
import { motion } from "framer-motion";
import { ShieldWarning, CheckCircle, Robot, CaretRight, XCircle, WhatsappLogo, Link as LinkIcon, ArrowsClockwise } from "@phosphor-icons/react";
import Link from "next/link";

const ActionBadge = ({ action, blocked }: { action: string, blocked: boolean }) => {
  if (blocked) {
    return <span className="px-3 py-1 bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/30 text-xs font-mono rounded-md border border-black/10 dark:border-white/10 line-through">{action}</span>;
  }
  
  switch(action) {
    case 'AUTO_RETRY':
      return <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono rounded-md border border-blue-500/20 inline-flex items-center gap-1.5"><ArrowsClockwise size={14} /> AUTO_RETRY</span>;
    case 'WHATSAPP_REMINDER':
      return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono rounded-md border border-emerald-500/20 inline-flex items-center gap-1.5"><WhatsappLogo size={14} /> WHATSAPP_REMINDER</span>;
    case 'SMART_PAYMENT_LINK':
      return <span className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-mono rounded-md border border-purple-500/20 inline-flex items-center gap-1.5"><LinkIcon size={14} /> SMART_PAYMENT_LINK</span>;
    case 'NO_ACTION':
      return <span className="px-3 py-1 bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 text-xs font-mono rounded-md border border-black/10 dark:border-white/10">NO_ACTION</span>;
    default:
      return <span className="px-3 py-1 bg-black/5 dark:bg-white/5 text-black/80 dark:text-white/80 text-xs font-mono rounded-md border border-black/10 dark:border-white/10">{action}</span>;
  }
}

export default function TransactionDrillDown({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tx, setTx] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/transactions").then(r => r.json()).then(d => {
      setTx(d.transactions.find((t: any) => t.id === id));
    });
    fetch(`/api/audit?transactionId=${id}`).then(r => r.json()).then(d => setAudits(d.audits));
  }, [id]);

  if (!tx) return (
    <div className="h-[60vh] flex flex-col gap-4 items-center justify-center text-black/40 dark:text-white/40">
      <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 dark:border-white/10 dark:border-t-white/40 rounded-full animate-spin"></div>
      <p className="font-mono text-sm tracking-widest uppercase">Decrypting Ledger...</p>
    </div>
  );

  const isBlocked = audits.some(a => a.actionBlocked);
  const amountFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: tx.currency }).format(tx.amount / 100);

  const pipelineStates = tx.type === 'payment' 
    ? ['detected', 'diagnosed', 'scored', 'strategy_selected', 'guardrail_checked', 'action_executed']
    : ['overdue', 'chaser_sent', 'promise_requested', 'promise_logged', 'escalated'];

  return (
    <div className="space-y-12 pb-24 text-black dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] uppercase tracking-[0.2em] font-medium text-black/70 dark:text-white/70">
            <Link href="/dashboard/transactions" className="hover:text-black dark:hover:text-white transition-colors">← Back to Ledger</Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight font-mono break-all">{tx.id}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 capitalize">
            {tx.type} Pipeline
          </div>
          <div className={`px-4 py-2 rounded-full border ${isBlocked ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'} capitalize`}>
            {isBlocked ? 'Blocked' : tx.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Metadata & Timeline */}
        <div className="lg:col-span-5 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <DoubleBezelCard innerClassName="p-8 grid grid-cols-2 gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Robot size={120} className="text-black dark:text-white" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-[10px] font-semibold text-black/40 dark:text-white/30 uppercase tracking-[0.2em] mb-2">Customer</p>
                <p className="text-xl font-medium">{tx.customerName}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-[10px] font-semibold text-black/40 dark:text-white/30 uppercase tracking-[0.2em] mb-2">Amount</p>
                <p className="text-2xl tracking-tight font-medium">{amountFormatted}</p>
              </div>
              <div className="col-span-2 pt-4 border-t border-black/10 dark:border-white/5">
                <p className="text-[10px] font-semibold text-black/40 dark:text-white/30 uppercase tracking-[0.2em] mb-2">Failure Reason</p>
                <p className="text-lg font-mono text-black/80 dark:text-white/80">{tx.failureReason || 'N/A'}</p>
              </div>
            </DoubleBezelCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <DoubleBezelCard innerClassName="p-8">
              <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-black/40 dark:text-white/40 mb-8 flex items-center gap-2">
                <CaretRight className="text-black/20 dark:text-white/20" /> State Machine
              </h3>
              <div className="relative border-l border-black/10 dark:border-white/10 ml-3 space-y-8 pb-4">
                {pipelineStates.map((state, i) => {
                  const isCurrent = audits.length > 0 && audits[0].stateTo === state || (isBlocked && state === 'guardrail_checked');
                  const isPast = audits.length > 0 && pipelineStates.indexOf(audits[0].stateTo) >= i && !isCurrent;
                  
                  return (
                    <div key={state} className="relative pl-8 group">
                      {/* Node point */}
                      <div className={`absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full transition-all duration-500 ${
                        isBlocked && state === 'guardrail_checked' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-150' :
                        isCurrent ? 'bg-black dark:bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] dark:shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-125' :
                        isPast ? 'bg-black/40 dark:bg-white/40' : 'bg-white dark:bg-[#0A0A0A] border border-black/20 dark:border-white/20'
                      }`} />
                      
                      <div className={`transition-all duration-300 ${isCurrent ? 'opacity-100 translate-x-1 font-medium' : isPast ? 'opacity-60' : 'opacity-30'}`}>
                        <h3 className="font-mono text-sm capitalize">{state.replace('_', ' ')}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DoubleBezelCard>
          </motion.div>
        </div>

        {/* Right Col: Audit Log */}
        <div className="lg:col-span-7">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="h-full">
            {/* 
              Force dark mode styles on this specific panel by appending it with hardcoded colors
              so it always looks like a hacker terminal regardless of light/dark mode! 
            */}
            <DoubleBezelCard innerClassName="p-1 md:p-2 h-full min-h-[600px] flex flex-col bg-[#050505]">
              <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#050505] z-10 rounded-t-[calc(2rem-0.5rem)]">
                <div className="flex items-center gap-3 text-xs font-semibold text-white/50 tracking-[0.2em] uppercase">
                  <Robot size={18} className="text-white" />
                  <span className="text-white">Immutable Audit Ledger</span>
                </div>
                <div className="text-[10px] text-white/30 font-mono tracking-widest uppercase">System Gen</div>
              </div>
              
              <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
                {audits.map((audit, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1), ease: [0.32, 0.72, 0, 1] }} 
                    key={audit.id} 
                    className={`relative p-6 rounded-2xl border backdrop-blur-sm overflow-hidden ${
                      audit.actionBlocked 
                        ? 'bg-amber-950/10 border-amber-500/30 ring-1 ring-amber-500/20' 
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    {/* Subtle background glow for blocked */}
                    {audit.actionBlocked && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                    )}

                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8 relative z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40 font-mono bg-black/40 px-2 py-1 rounded-md border border-white/5">
                          {new Date(audit.timestamp).toISOString().split('T')[1].slice(0,8)}
                        </span>
                        <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                          {audit.stateFrom} <CaretRight size={10} weight="bold" className="text-white/20"/> {audit.stateTo}
                        </span>
                      </div>
                      
                      {audit.actionBlocked ? (
                        <div className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full tracking-wide inline-flex items-center gap-1.5 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                          <ShieldWarning weight="fill" size={14} /> ACTION BLOCKED
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-400 border border-emerald-400/20 px-3 py-1 rounded-full bg-emerald-400/10 inline-flex items-center gap-1.5">
                          <CheckCircle weight="fill" size={14} /> CLEARANCE GRANTED
                        </div>
                      )}
                    </div>

                    <div className="space-y-8 relative z-10">
                      {/* Inputs */}
                      <div>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-3">Telemetry / Context</p>
                        <div className="bg-[#020202] border border-white/5 p-4 rounded-xl">
                          <pre className="text-xs font-mono text-white/60 overflow-x-auto leading-relaxed">
                            {JSON.stringify(JSON.parse(audit.inputSignals || '{}'), null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Guardrails */}
                      <div>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-3">Guardrail Execution</p>
                        <div className="grid grid-cols-1 gap-2">
                          {JSON.parse(audit.guardrailResults || '[]').map((r: any) => (
                            <div key={r.rule} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                              r.passed ? 'bg-white/[0.02] text-white/60' : 'bg-amber-500/5 text-amber-400 border border-amber-500/20'
                            }`}>
                              <div className="mt-0.5">
                                {r.passed ? <CheckCircle className="text-emerald-500/50" weight="fill" /> : <XCircle className="text-amber-500" weight="fill" />}
                              </div>
                              <div>
                                <p className="font-mono text-xs text-white">{r.rule}</p>
                                {!r.passed && <p className="opacity-80 mt-1.5 text-xs leading-relaxed max-w-md text-white">{r.reason}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.2em]">Strategy Output</p>
                        {/* We use the same ActionBadge but force dark mode properties because it's in the terminal */}
                        <div className="[&_span]:!bg-white/5 [&_span]:!border-white/10 [&_span]:!text-white/80">
                          <ActionBadge action={audit.actionTaken} blocked={audit.actionBlocked} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {audits.length === 0 && (
                  <div className="text-center text-white/30 py-12 text-sm font-mono">No telemetry found.</div>
                )}
              </div>
            </DoubleBezelCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
