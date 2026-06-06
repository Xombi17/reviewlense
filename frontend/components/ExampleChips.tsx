import React from 'react';

interface ExampleChipsProps {
  onChipClick: (example: string) => void;
}

const EXAMPLES = [
  "Battery dies in 2 hours",
  "Great product, amazing quality!",
  "Arrived damaged but customer service was fantastic",
  "Waste of money, cheap materials",
  "Exceeded expectations, highly recommend!",
  "Stopped working after 3 days"
];

export default function ExampleChips({ onChipClick }: ExampleChipsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {EXAMPLES.map((example, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onChipClick(example)}
          className="rounded-lg border-2 border-gray-300 py-2 px-4 cursor-pointer hover:bg-gray-100 hover:border-gray-400 text-sm truncate text-left text-gray-700 font-medium transition-colors"
          title={example}
        >
          {example}
        </button>
      ))}
    </div>
  );
}
