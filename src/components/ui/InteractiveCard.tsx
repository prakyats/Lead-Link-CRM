import React from 'react';
import { cn } from './utils';

interface InteractiveCardProps {
  isActive: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function InteractiveCard({
  isActive,
  onClick,
  children,
  className
}: InteractiveCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all duration-500 ease-out group overflow-hidden",
        "hover:scale-[1.02] active:scale-95",
        isActive
          ? "ring-2 ring-primary/80 bg-primary/5 shadow-[0_0_25px_rgba(34,197,94,0.3)] scale-[1.02]"
          : "opacity-80 hover:opacity-100 hover:ring-1 hover:ring-primary/30 hover:bg-primary/[0.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        className
      )}
    >
      {/* Top Accent Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 h-[2px] w-full transition-all duration-500 z-30",
          isActive ? "bg-primary opacity-100" : "bg-primary opacity-0 group-hover:opacity-40"
        )}
      />

      {/* Hover Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none z-20" />

      {/* Guide Label: "Filter" - Corner Flag Style */}
      <div className={cn(
        "absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground font-black text-[7px] uppercase tracking-[0.25em] rounded-bl-xl shadow-lg z-40 shadow-primary/20",
        "transition-all duration-500 transform origin-top-right",
        "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100",
        isActive && "opacity-0"
      )}>
        Select Filter
      </div>

      <div className="relative z-10 transition-all duration-500 group-hover:opacity-40 group-hover:-translate-x-2 pr-12">
        {children}
      </div>
    </div>
  );
}
