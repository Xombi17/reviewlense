import React from 'react';
import type { AspectSentiment } from '../lib/types';

interface AspectChipsProps {
  aspects: AspectSentiment[];
}

export default function AspectChips({ aspects }: AspectChipsProps) {
  if (!aspects || aspects.length === 0) {
    return <div className="text-muted-text font-mono text-[11px] uppercase">No aspects detected</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {aspects.map((aspect, idx) => {
        const isPositive = aspect.sentiment === 1;
        const arrow = isPositive ? "↑" : "↓";
        return (
          <div 
            key={idx} 
            className={`opacity-0 animate-fade-up backdrop-blur-[4px] rounded-[4px] py-1 px-3 text-[12px] font-mono font-medium flex items-center gap-1.5 border select-none transition-all duration-200 ${
              isPositive 
                ? 'bg-[rgba(57,255,20,0.1)] text-accent-green border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)]' 
                : 'bg-[rgba(255,71,87,0.1)] text-accent-coral border-[rgba(255,71,87,0.2)] hover:bg-[rgba(255,71,87,0.2)]'
            }`}
            style={{ 
              animationDelay: `${idx * 40}ms`,
              animationFillMode: 'forwards'
            }}
          >
            <span>{aspect.aspect}</span>
            <span className="font-bold text-[13px]">{arrow}</span>
          </div>
        );
      })}
    </div>
  );
}
