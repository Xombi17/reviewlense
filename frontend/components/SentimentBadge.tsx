import React from 'react';

interface SentimentBadgeProps {
  sentiment: 0 | 1;
}

export default function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (sentiment === 1) {
    return (
      <div className="flex items-center gap-2.5 font-mono text-[28px] font-bold text-accent-green leading-none tracking-wide select-none">
        <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
        POSITIVE
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 font-mono text-[28px] font-bold text-accent-coral leading-none tracking-wide select-none">
      <span className="w-2.5 h-2.5 rounded-full bg-accent-coral" />
      NEGATIVE
    </div>
  );
}
