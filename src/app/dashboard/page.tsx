"use client";

import { useEffect, useState } from "react";
import { DoubleBezelCard } from "../../components/ui/DoubleBezelCard";
import { motion } from "framer-motion";
import { ArrowUpRight, ShieldWarning, HandCoins, Lightning, CurrencyInr, CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";

export default function SummaryDashboard() {
  const [data, setData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const fetchSummary = () => {
    fetch("/api/summary").then(r => r.json()).then(setData);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRunPipelines = async () => {
    setIsRunning(true);
    try {
      await fetch("/api/run-pipeline", { method: "POST" });
      fetchSummary();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  if (!data) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-black/40 dark:text-white/40 gap-4">
       <CircleNotch className="animate-spin text-black/20 dark:text-white/20" size={32} />
       <span className="font-mono text-xs tracking-widest uppercase">Booting Engine...</span>
    </div>
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-16 pb-24">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600 dark:text-emerald-400">
          <Lightning size={12} weight="fill" />
          Engine Online
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-light tracking-tight text-black dark:text-white">System Summary</motion.h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-8 gap-6 auto-rows-[220px]">
        
        {/* Revenue at Risk - Large Inverted Card (Always dark) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }} className="md:col-span-5 md:row-span-2">
          <div className="h-full rounded-[2rem] p-1.5 ring-1 shadow-2xl transition-colors duration-500 bg-[#111] ring-[#222]">
            <div className="rounded-[calc(2rem-0.375rem)] h-full w-full p-10 flex flex-col justify-between relative overflow-hidden group bg-gradient-to-br from-[#0A0A0A] to-[#050505] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-white">
              <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <CurrencyInr size={300} weight="thin" />
              </div>
              
              <div>
                <p className="text-[10px] font-semibold text-white/40 tracking-[0.2em] uppercase mb-4">Revenue at Risk</p>
                <div className="relative">
                  <p className="text-6xl md:text-8xl font-light tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">{formatCurrency(data.revenueAtRisk)}</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
                <div className="text-xs font-mono text-white/40">
                  Tracking <span className="text-white/80">{data.pipelineSplit.payment + data.pipelineSplit.receivables}</span> active cases across pipelines
                </div>
                <button 
                  onClick={handleRunPipelines}
                  disabled={isRunning}
                  className="group/btn relative rounded-full pl-6 pr-2 py-2 bg-white text-black hover:bg-white/90 transition-all flex items-center gap-4 text-sm font-semibold active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  {isRunning ? "Executing..." : "Run Pipelines"}
                  <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-all group-hover/btn:bg-black/20 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-[1px]">
                    {isRunning ? <CircleNotch size={14} className="animate-spin text-black" /> : <ArrowUpRight size={14} className="text-black" />}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Guardrail Blocks - Dynamic Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="md:col-span-3">
          <DoubleBezelCard innerClassName="p-8 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-amber-600 dark:text-amber-500/80 tracking-[0.2em] uppercase z-10">
              <ShieldWarning size={16} weight="fill" />
              Guardrail Blocks
            </div>
            <div className="z-10">
              <p className="text-6xl font-light tracking-tight text-black dark:text-white">{data.guardrailBlocks}</p>
              <Link href="/dashboard/transactions?blocked=true" className="mt-4 text-xs font-mono text-amber-600 dark:text-amber-500/60 hover:text-amber-500 transition-colors inline-flex items-center gap-2 group/link">
                View intercepted actions <span className="group-hover/link:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </DoubleBezelCard>
        </motion.div>

        {/* Recovery Rate - Dynamic Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.32, 0.72, 0, 1] }} className="md:col-span-3">
          <DoubleBezelCard innerClassName="p-8 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-500/80 tracking-[0.2em] uppercase z-10">
              <HandCoins size={16} weight="fill" />
              Capital Recovered
            </div>
            <div className="z-10">
              <p className="text-4xl md:text-5xl font-light tracking-tight mb-2 text-black dark:text-white">{formatCurrency(data.recovered)}</p>
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                {data.recoveryRate.toFixed(1)}% Yield
              </div>
            </div>
          </DoubleBezelCard>
        </motion.div>

      </div>
    </div>
  );
}
