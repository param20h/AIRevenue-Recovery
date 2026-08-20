"use client";

import { motion } from "framer-motion";
import React from "react";

export function AnimatedThemeToggler({ isDark, onToggle }: { isDark: boolean, onToggle: (dark: boolean) => void }) {
  const toggleTheme = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // If browser doesn't support View Transitions
    if (!(document as any).startViewTransition) {
      onToggle(!isDark);
      return;
    }

    const transition = (document as any).startViewTransition(() => {
      onToggle(!isDark);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.32, 0.72, 0, 1)",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    });
  };

  const properties = {
    sun: {
      r: 9,
      transform: "rotate(40deg)",
      cx: 12,
      cy: 4,
      opacity: 0
    },
    moon: {
      r: 5,
      transform: "rotate(90deg)",
      cx: 30,
      cy: 0,
      opacity: 1
    },
    springConfig: { mass: 4, tension: 250, friction: 35 }
  };

  const { r, transform, cx, cy, opacity } = isDark ? properties.moon : properties.sun;

  return (
    <button
      onClick={toggleTheme}
      className="p-1 rounded-full hover:bg-current/10 transition-colors outline-none"
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
        initial={false}
        animate={{ transform }}
        transition={properties.springConfig as any}
      >
        <mask id="moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <motion.circle
            initial={false}
            animate={{ cx, cy }}
            transition={properties.springConfig as any}
            r="9"
            fill="black"
          />
        </mask>
        
        <motion.circle
          cx="12"
          cy="12"
          initial={false}
          animate={{ r }}
          transition={properties.springConfig as any}
          mask="url(#moon-mask)" fill="currentColor" stroke="none"
        />
        
        <motion.g
          initial={false}
          animate={{ opacity }}
          transition={properties.springConfig as any}
        >
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </motion.g>
      </motion.svg>
    </button>
  );
}
