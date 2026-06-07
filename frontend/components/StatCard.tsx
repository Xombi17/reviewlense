import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
}

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-terminal-card border border-terminal-border p-6 rounded-[4px] relative overflow-hidden flex flex-col justify-end min-h-[100px] select-none hover:shadow-[0_0_12px_rgba(0,212,255,0.15)] glow-border-hover transition-all duration-300">
      {/* Top-left corner accent bar in cyan (3px width, 20px height) */}
      <div className="absolute top-0 left-0 w-[3px] h-[20px] bg-accent-cyan shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
      
      {/* Value (Bold Mono 36px) */}
      <span className="font-mono text-[36px] font-bold text-white leading-none tracking-tight">
        {value}
      </span>
      
      {/* Title/Label (DM Sans 12px muted) */}
      <h3 className="font-sans text-[12px] text-muted-text uppercase tracking-wider mt-2" title={title}>
        {title}
      </h3>
    </div>
  );
}
