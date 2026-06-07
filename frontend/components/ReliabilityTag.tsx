import React from 'react';

interface ReliabilityTagProps {
  reliability: "HIGH" | "MEDIUM" | "LOW";
}

export default function ReliabilityTag({ reliability }: ReliabilityTagProps) {
  const styles = {
    HIGH: "bg-[rgba(57,255,20,0.15)] text-accent-green border border-[rgba(57,255,20,0.3)]",
    MEDIUM: "bg-[rgba(255,184,0,0.15)] text-accent-amber border border-[rgba(255,184,0,0.3)]",
    LOW: "bg-[rgba(255,71,87,0.15)] text-accent-coral border border-[rgba(255,71,87,0.3)]",
  };

  return (
    <div className={`rounded-full py-1 px-3.5 font-mono text-[10px] font-bold uppercase tracking-wider select-none w-fit ${styles[reliability]}`}>
      {reliability} RELIABILITY
    </div>
  );
}
