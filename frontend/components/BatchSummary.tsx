import React from "react";
import StatCard from "./StatCard";
import { BatchResponse } from "../lib/types";

interface BatchSummaryProps {
  results: BatchResponse;
}

export default function BatchSummary({ results }: BatchSummaryProps) {
  const processed = results.processed;
  const skipped = results.skipped;
  const suspicious = results.suspicious_count;
  const confidence = `${Math.round(results.avg_confidence * 100)}%`;

  return (
    <div className="flex flex-col gap-4 select-none">
      <span className="font-mono text-[11px] text-muted-text uppercase tracking-widest">
        Analysis Summary // SIGNAL READOUT
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Processed" value={processed.toLocaleString()} />
        <StatCard title="Skipped Reviews" value={skipped.toLocaleString()} />
        <StatCard title="Suspicious Count" value={suspicious.toLocaleString()} />
        <StatCard title="Avg Confidence" value={confidence} />
      </div>
    </div>
  );
}
