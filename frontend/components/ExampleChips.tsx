import React from 'react';

interface ExampleChipsProps {
  onChipClick: (example: string) => void;
}

const EXAMPLES = [
  "Battery dies in 2 hours, sound is extremely muffled...",
  "Great product, amazing quality! Exceeded expectations...",
  "Arrived damaged but customer service was fantastic...",
  "Waste of money, cheap materials and very fragile..."
];

export default function ExampleChips({ onChipClick }: ExampleChipsProps) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
      {EXAMPLES.map((example, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onChipClick(example)}
          className="flex-1 min-w-[100px] text-left truncate font-mono text-[11px] text-muted-text bg-[#111118] border border-terminal-border rounded-full py-1.5 px-3 hover:text-accent-cyan hover:border-accent-cyan transition-all duration-200 select-none cursor-pointer"
          title={example}
        >
          {example}
        </button>
      ))}
    </div>
  );
}
