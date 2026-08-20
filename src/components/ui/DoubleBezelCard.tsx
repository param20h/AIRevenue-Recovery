"use client";

import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export function DoubleBezelCard({ children, className, innerClassName }: CardProps) {
  return (
    <div className={cn("rounded-[2rem] p-1.5 ring-1 shadow-2xl transition-colors duration-500", className)} style={{ backgroundColor: 'var(--card-outer-bg)', '--tw-ring-color': 'var(--card-outer-ring)' } as any}>
      <div className={cn("rounded-[calc(2rem-0.375rem)] h-full w-full transition-colors duration-500", innerClassName)} style={{ backgroundColor: 'var(--card-inner-bg)', boxShadow: 'var(--card-inner-shadow)' }}>
        {children}
      </div>
    </div>
  );
}
