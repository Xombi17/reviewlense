import React from "react";
import StatCard from "./StatCard";
import { BatchResponse } from "../lib/types";

interface BatchSummaryProps {
  results: BatchResponse;
}

export default function BatchSummary({ results }: BatchSummaryProps) {
  const total = results.total;
  const processed = results.processed;
  const skipped = results.skipped;
  const suspicious = results.suspicious_count;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Analysis Summary
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reviews" value={total} />
        <StatCard title="Successfully Processed" value={processed} unit="reviews" />
        <StatCard title="Skipped / Invalid" value={skipped} unit="skipped" />
        <StatCard title="Suspicious" value={suspicious} unit="flagged" />
      </div>
    </div>
  );
}
