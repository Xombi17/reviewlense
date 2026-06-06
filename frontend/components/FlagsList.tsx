import React from 'react';

interface FlagsListProps {
  flags: string[];
}

export default function FlagsList({ flags }: FlagsListProps) {
  if (!flags || flags.length === 0) {
    return <div className="text-gray-500 italic text-sm">No flags detected</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag, idx) => (
        <div 
          key={idx} 
          className="rounded px-2.5 py-1 text-xs bg-orange-100 text-orange-900 dark:bg-orange-950/30 dark:text-orange-400 font-semibold flex items-center gap-1 hover:shadow-sm transition-shadow duration-200"
        >
          <span className="w-4 h-4 inline-flex items-center justify-center">⚠️</span>
          <span>{flag.replace(/_/g, ' ')}</span>
        </div>
      ))}
    </div>
  );
}

