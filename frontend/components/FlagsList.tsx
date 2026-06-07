import React from 'react';

interface FlagsListProps {
  flags: string[];
}

export default function FlagsList({ flags }: FlagsListProps) {
  if (!flags || flags.length === 0) {
    return <div className="text-muted-text font-mono text-[11px] uppercase">No flags detected</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag, idx) => (
        <div 
          key={idx} 
          className="rounded-[4px] px-2.5 py-1 text-[11px] bg-[#1A1400] text-accent-amber border border-[rgba(255,184,0,0.2)] font-mono flex items-center gap-1.5 select-none hover:border-[rgba(255,184,0,0.4)] transition-colors duration-200"
        >
          <span>⚠ {flag}</span>
        </div>
      ))}
    </div>
  );
}
