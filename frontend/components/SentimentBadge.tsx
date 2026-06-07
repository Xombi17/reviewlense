import React from 'react';

interface SentimentBadgeProps {
  sentiment: 0 | 1;
}

export default function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (sentiment === 1) {
    return (
      <div className="flex items-center gap-3 font-mono text-[32px] font-bold text-accent-green leading-none tracking-wide select-none glow-text-green">
        <span className="w-3.5 h-3.5 rounded-full bg-accent-green animate-pulse-dot" />
        POSITIVE
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 font-mono text-[32px] font-bold text-accent-coral leading-none tracking-wide select-none glow-text-coral">
      <span className="w-3.5 h-3.5 rounded-full bg-accent-coral animate-pulse-dot" />
      NEGATIVE
    </div>
  );
}
