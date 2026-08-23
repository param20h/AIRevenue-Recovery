"use client";

import { useEffect, useState, useRef } from "react";
import { DoubleBezelCard } from "../../components/ui/DoubleBezelCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, ShieldWarning, HandCoins, Lightning, CurrencyInr,
  CircleNotch, CalendarCheck, ArrowsClockwise, CheckCircle, XCircle, Clock
} from "@phosphor-icons/react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface RunSnapshot {
  ts: string;
  before: { revenueAtRisk: number; recovered: number; guardrailBlocks: number };
  after: { revenueAtRisk: number; recovered: number; guardrailBlocks: number };
}

interface LiveLogEntry {
  txId: string;
  action: string;
  blocked: boolean;
  blockReason?: string | null;
}

export default function SummaryDashboard() {
  const [data, setData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [liveLog, setLiveLog] = useState<LiveLogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [runHistory, setRunHistory] = useState<RunSnapshot[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchSummary = async () => {
    const res = await fetch("/api/summary");
    const d = await res.json();
    setData(d);
    return d;
  };

  useEffect(() => {
    fetchSummary();
    try {
      const saved = localStorage.getItem("recovery_run_history");
      if (saved) setRunHistory(JSON.parse(saved));
    } catch { }
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveLog]);

  const handleRunPipelines = async () => {
    setIsRunning(true);
    setLiveLog([]);
    setShowLog(true);

    // 1. Snapshot before
    const before = await fetchSummary();

    // 2. Get all pending transactions
    const txRes = await fetch("/api/transactions");
    const txData = await txRes.json();
    const pending = (txData.transactions ?? []).filter(
      (t: any) => t.status === "failed" || t.status === "overdue"
    );

    // 3. Run pipeline per transaction — stream log entries live
    for (const tx of pending) {
      setLiveLog(prev => [...prev, { txId: tx.id, action: "...", blocked: false }]);
      try {
        const res = await fetch("/api/run-pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: tx.id }),
        });
        const result = await res.json();
        setLiveLog(prev =>
          prev.map(e =>
            e.txId === tx.id
              ? { txId: tx.id, action: result.actionTaken, blocked: result.actionBlocked, blockReason: result.blockReason }
              : e
          )
        );
      } catch {
        setLiveLog(prev =>
          prev.map(e => e.txId === tx.id ? { ...e, action: "ERROR" } : e)
        );
      }
    }

    // 4. Snapshot after + save history
    const after = await fetchSummary();
    const entry: RunSnapshot = {
      ts: new Date().toLocaleString("en-IN"),
      before: { revenueAtRisk: before.revenueAtRisk, recovered: before.recovered, guardrailBlocks: before.guardrailBlocks },
      after: { revenueAtRisk: after.revenueAtRisk, recovered: after.recovered, guardrailBlocks: after.guardrailBlocks },
    };
    const newHistory = [entry, ...runHistory].slice(0, 5);
    setRunHistory(newHistory);
    try { localStorage.setItem("recovery_run_history", JSON.stringify(newHistory)); } catch { }

    setIsRunning(false);
  };

  if (!data) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-black/40 dark:text-white/40 gap-4">
      <CircleNotch className="animate-spin text-black/20 dark:text-white/20" size={32} />
      <span className="font-mono text-xs tracking-widest uppercase">Booting Engine...</span>
    </div>
  );

  const fmt = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const COLORS = ["#f43f5e", "#f97316", "#eab308", "#6366f1", "#8b5cf6"];

  return (
    <div className="space-y-16 pb-24">
      {/* Header */}
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600 dark:text-emerald-400">
          <Lightning size={12} weight="fill" /> Engine Online
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-light tracking-tight text-black dark:text-white">
          System Summary
        </motion.h1>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-6 auto-rows-[220px]">

        {/* Revenue at Risk */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }} className="md:col-span-5 md:row-span-2">
          <DoubleBezelCard innerClassName="p-10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none text-black dark:text-white">
              <CurrencyInr size={300} weight="thin" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-black/40 dark:text-white/40 tracking-[0.2em] uppercase mb-4">Revenue at Risk</p>
              <p className="text-6xl md:text-8xl font-light tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-black to-black/60 dark:from-white dark:to-white/60">{fmt(data.revenueAtRisk)}</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
              <div className="text-xs font-mono text-black/40 dark:text-white/40">
                Tracking <span className="text-black/80 dark:text-white/80">{data.pipelineSplit.payment + data.pipelineSplit.receivables}</span> active cases across pipelines
              </div>
              <button
                onClick={handleRunPipelines}
                disabled={isRunning}
                className="group/btn relative rounded-full pl-6 pr-2 py-2 bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all flex items-center gap-4 text-sm font-semibold active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none shadow-xl"
              >
                {isRunning ? "Executing..." : "Run Pipelines"}
                <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center transition-all group-hover/btn:bg-white/20 dark:group-hover/btn:bg-black/20">
                  {isRunning ? <CircleNotch size={14} className="animate-spin text-white dark:text-black" /> : <ArrowUpRight size={14} className="text-white dark:text-black" />}
                </div>
              </button>
            </div>
          </DoubleBezelCard>
        </motion.div>

        {/* Guardrail Blocks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="md:col-span-3">
          <DoubleBezelCard innerClassName="p-8 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-amber-600 dark:text-amber-500/80 tracking-[0.2em] uppercase z-10">
              <ShieldWarning size={16} weight="fill" /> Guardrail Blocks
            </div>
            <div className="z-10">
              <p className="text-6xl font-light tracking-tight text-black dark:text-white">{data.guardrailBlocks}</p>
              <Link href="/dashboard/transactions?blocked=true" className="mt-4 text-xs font-mono text-amber-600 dark:text-amber-500/60 hover:text-amber-500 transition-colors inline-flex items-center gap-2 group/link">
                View intercepted actions <span className="group-hover/link:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </DoubleBezelCard>
        </motion.div>

        {/* Capital Recovered */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.32, 0.72, 0, 1] }} className="md:col-span-3">
          <DoubleBezelCard innerClassName="p-8 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-500/80 tracking-[0.2em] uppercase z-10">
              <HandCoins size={16} weight="fill" /> Capital Recovered
            </div>
            <div className="z-10">
              <p className="text-4xl md:text-5xl font-light tracking-tight mb-2 text-black dark:text-white">{fmt(data.recovered)}</p>
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                {data.recoveryRate.toFixed(1)}% Yield
              </div>
            </div>
          </DoubleBezelCard>
        </motion.div>
      </div>

      {/* Row 2: Failure Breakdown + Promises to Pay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Failure Reason Breakdown Chart */}
        {data.failureBreakdown?.length > 0 && (
          <motion.div className={data.promisesToPay?.length > 0 ? "" : "md:col-span-2"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <DoubleBezelCard innerClassName="p-8">
              <p className="text-[10px] font-semibold text-black/40 dark:text-white/40 tracking-[0.2em] uppercase mb-6">Failure Reason Breakdown</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.failureBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={32}>
                  <XAxis dataKey="reason" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} tickMargin={12} />
                  <YAxis tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} allowDecimals={false} tickMargin={12} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', padding: '12px 16px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600, padding: 0 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em', marginBottom: '8px' }}
                    formatter={(val: any, name: string) => [val, name === 'count' ? 'Cases' : 'Amount']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.failureBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </DoubleBezelCard>
          </motion.div>
        )}

        {/* Promises to Pay */}
        {data.promisesToPay?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <DoubleBezelCard innerClassName="p-8">
              <div className="flex items-center gap-3 text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-[0.2em] uppercase mb-6">
                <CalendarCheck size={16} weight="fill" /> Promises to Pay
              </div>
              <div className="space-y-3">
                {data.promisesToPay.map((p: any) => {
                  const due = p.promisedPayDate ? new Date(p.promisedPayDate) : null;
                  const overdue = due && due < new Date();
                  return (
                    <Link key={p.transactionId} href={`/dashboard/transaction/${p.transactionId}`} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors group">
                      <span className="font-mono text-xs text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white transition-colors">{p.transactionId}</span>
                      {due && (
                        <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${overdue ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          <Clock size={10} />
                          {overdue ? 'OVERDUE' : `Due ${due.toLocaleDateString('en-IN')}`}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </DoubleBezelCard>
          </motion.div>
        )}
      </div>

      {/* Live Pipeline Log */}
      <AnimatePresence>
        {showLog && liveLog.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }}>
            <DoubleBezelCard innerClassName="p-0 overflow-hidden">
              <div className="p-6 pb-4 border-b border-black/10 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-bold text-black/50 dark:text-white/50 tracking-[0.2em] uppercase">
                  <ArrowsClockwise size={14} className={isRunning ? 'animate-spin' : ''} />
                  Live Pipeline Log
                </div>
                {!isRunning && <button onClick={() => setShowLog(false)} className="text-xs text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">Dismiss</button>}
              </div>
              <div className="p-4 space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
                {liveLog.map((entry, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-3 p-2.5 rounded-lg ${entry.blocked ? 'bg-amber-500/5 text-amber-700 dark:text-amber-400' : entry.action === '...' ? 'text-black/40 dark:text-white/30' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {entry.action === '...' ? <CircleNotch size={12} className="animate-spin shrink-0" /> : entry.blocked ? <XCircle size={12} weight="fill" className="shrink-0" /> : <CheckCircle size={12} weight="fill" className="shrink-0" />}
                    <span className="text-black/50 dark:text-white/40">{entry.txId}</span>
                    <span>→</span>
                    <span className="font-bold">{entry.action === '...' ? 'processing...' : entry.action}</span>
                    {entry.blocked && entry.blockReason && <span className="text-amber-600/70 dark:text-amber-400/50 truncate">({entry.blockReason})</span>}
                  </motion.div>
                ))}
                <div ref={logEndRef} />
              </div>
            </DoubleBezelCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run History Timeline */}
      {runHistory.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-semibold text-black/40 dark:text-white/40 tracking-[0.2em] uppercase">Batch Run History</p>
          <div className="space-y-3">
            {runHistory.map((run, i) => {
              const deltaRecovered = run.after.recovered - run.before.recovered;
              const deltaBlocks = run.after.guardrailBlocks - run.before.guardrailBlocks;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <DoubleBezelCard innerClassName="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-mono text-xs text-black/50 dark:text-white/40">{run.ts}</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <span className="text-black/40 dark:text-white/30">Recovered </span>
                        <span className={`font-bold font-mono ${deltaRecovered > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-black/60 dark:text-white/60'}`}>
                          {deltaRecovered > 0 ? `+${fmt(deltaRecovered)}` : fmt(run.after.recovered)}
                        </span>
                      </div>
                      <div>
                        <span className="text-black/40 dark:text-white/30">Blocks </span>
                        <span className={`font-bold font-mono ${deltaBlocks > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-black/60 dark:text-white/60'}`}>
                          {deltaBlocks > 0 ? `+${deltaBlocks}` : run.after.guardrailBlocks}
                        </span>
                      </div>
                      <div>
                        <span className="text-black/40 dark:text-white/30">At Risk </span>
                        <span className="font-bold font-mono text-black/70 dark:text-white/70">{fmt(run.after.revenueAtRisk)}</span>
                      </div>
                    </div>
                  </DoubleBezelCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
