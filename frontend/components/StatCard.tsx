import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
}

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-terminal-card border border-terminal-border p-6 rounded-[3px] relative overflow-hidden flex flex-col justify-end min-h-[96px] select-none hover-border-transition transition-all duration-200">
      {/* Value */}
      <span className="font-mono text-[30px] font-bold text-white leading-none tracking-tight">
        {value}
      </span>
      
      {/* Title/Label */}
      <h3 className="font-sans text-[11px] text-muted-text uppercase tracking-wider mt-2" title={title}>
        {title}
      </h3>
    </div>
  );
}
