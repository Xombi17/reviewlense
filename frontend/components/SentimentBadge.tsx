import React from 'react';

interface SentimentBadgeProps {
  sentiment: 0 | 1;
}

export default function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (sentiment === 1) {
    return (
      <div className="rounded-full py-2 px-4 text-sm font-semibold bg-green-100 text-green-700 w-fit">
        😊 Positive
      </div>
    );
  }
  return (
    <div className="rounded-full py-2 px-4 text-sm font-semibold bg-red-100 text-red-700 w-fit">
      😞 Negative
    </div>
  );
}
