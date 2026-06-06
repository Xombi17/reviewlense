import React from 'react';

interface FlagsListProps {
  flags: string[];
}

export default function FlagsList({ flags }: FlagsListProps) {
  if (!flags || flags.length === 0) {
    return <div className="text-gray-500 italic text-sm">No flags detected</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {flags.map((flag, idx) => (
        <div key={idx} className="rounded-lg py-2 px-3 text-sm bg-amber-50 text-amber-700 w-fit font-medium">
          ⚠️ {flag.replace(/_/g, ' ')}
        </div>
      ))}
    </div>
  );
}
