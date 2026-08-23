"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatedThemeToggler } from "./AnimatedThemeToggler";

export function NavClient() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("recovery_os_theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
  }, []);

  // Sync to localStorage and HTML class whenever theme changes
  useEffect(() => {
    localStorage.setItem("recovery_os_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-max rounded-full backdrop-blur-2xl px-6 py-3 flex items-center gap-8 shadow-2xl transition-colors duration-500 border" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-ring)' }}>
      <div className="font-semibold tracking-wide text-current">Recovery<span className="opacity-50">OS</span></div>
      <div className="flex gap-6 text-sm" style={{ color: 'var(--nav-text)' }}>
        <Link href="/dashboard" className="hover:text-current transition-colors">Summary</Link>
        <Link href="/dashboard/transactions" className="hover:text-current transition-colors">Transactions</Link>
      </div>
      <div className="flex items-center gap-3 border-l border-current/10 pl-6">
        <AnimatedThemeToggler theme={theme} onThemeChange={setTheme} />
      </div>
    </nav>
  );
}
