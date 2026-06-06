import React from 'react';

interface SentimentBadgeProps {
  sentiment: 0 | 1;
}

export default function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (sentiment === 1) {
    return (
      <div className="rounded-lg py-2 px-4 text-sm font-semibold bg-green-600 text-white w-fit hover:shadow-lg transition-shadow duration-200">
        😊 Positive
      </div>
    );
  }
  return (
    <div className="rounded-lg py-2 px-4 text-sm font-semibold bg-red-600 text-white w-fit hover:shadow-lg transition-shadow duration-200">
      😞 Negative
    </div>
  );
}

