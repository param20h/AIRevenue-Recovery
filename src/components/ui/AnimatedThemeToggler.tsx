"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedThemeTogglerProps {
  className?: string;
  duration?: number;
  variant?: "circle" | "swipe";
  fromCenter?: boolean;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 550,
  variant = "circle",
  fromCenter = false,
  theme,
  onThemeChange,
}: AnimatedThemeTogglerProps) => {
  const isDark = theme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    onThemeChange(nextTheme);
  };

  // SVG morph variants
  const svgVariants = {
    dark: { rotate: 40 },
    light: { rotate: 90 },
  };

  const centerCircleVariants = {
    dark: { r: 9 },
    light: { r: 5 },
  };

  const centerMaskVariants = {
    dark: { cx: 12, cy: 4 },
    light: { cx: 30, cy: 0 },
  };

  const rayVariants = {
    dark: { scale: 0, opacity: 0 },
    light: { scale: 1, opacity: 1 },
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
        "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10",
        "border border-slate-200 dark:border-white/10",
        "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white",
        className
      )}
      aria-label="Toggle Theme"
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isDark ? "dark" : "light"}
        variants={svgVariants}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10 pointer-events-none"
      >
        <mask id="theme-mask">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle
            cx="12"
            cy="4"
            r="9"
            fill="black"
            animate={isDark ? "dark" : "light"}
            variants={centerMaskVariants}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}
          />
        </mask>

        <motion.circle
          cx="12"
          cy="12"
          r="9"
          fill="currentColor"
          mask="url(#theme-mask)"
          animate={isDark ? "dark" : "light"}
          variants={centerCircleVariants}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        />

        {/* Sun rays */}
        <g stroke="currentColor">
          <motion.line
            x1="12"
            y1="1"
            x2="12"
            y2="3"
            variants={rayVariants}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.line
            x1="12"
            y1="21"
            x2="12"
            y2="23"
            variants={rayVariants}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.line
            x1="4.22"
            y1="4.22"
            x2="5.64"
            y2="5.64"
            variants={rayVariants}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.line
            x1="18.36"
            y1="18.36"
            x2="19.78"
            y2="19.78"
            variants={rayVariants}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.line
            x1="1"
            y1="12"
            x2="3"
            y2="12"
            variants={rayVariants}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.line
            x1="21"
            y1="12"
            x2="23"
            y2="12"
            variants={rayVariants}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.line
            x1="4.22"
            y1="19.78"
            x2="5.64"
            y2="18.36"
            variants={rayVariants}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.line
            x1="18.36"
            y1="5.64"
            x2="19.78"
            y2="4.22"
            variants={rayVariants}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
        </g>
      </motion.svg>
    </button>
  );
};