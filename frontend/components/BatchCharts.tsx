"use client";

import React from "react";
import SentimentChart from "./SentimentChart";
import ReliabilityChart from "./ReliabilityChart";
import { BatchResponse } from "../lib/types";

interface BatchChartsProps {
  results: BatchResponse;
}

export default function BatchCharts({ results }: BatchChartsProps) {
  const positive = results.sentiment_distribution.positive ?? 0;
  const negative = results.sentiment_distribution.negative ?? 0;

  // Extract counts for high, medium, low
  const rawHigh = results.reliability_breakdown.HIGH ?? 0;
  const rawMedium = results.reliability_breakdown.MEDIUM ?? 0;
  const rawLow = results.reliability_breakdown.LOW ?? 0;
  const rawTotal = rawHigh + rawMedium + rawLow;

  const highPct = rawTotal > 0 ? (rawHigh / rawTotal) * 100 : 0;
  const mediumPct = rawTotal > 0 ? (rawMedium / rawTotal) * 100 : 0;
  const lowPct = rawTotal > 0 ? (rawLow / rawTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
      
      {/* Sentiment Chart Card */}
      <div className="bg-terminal-card border border-terminal-border p-6 rounded-[4px] flex flex-col glow-border-hover transition-all duration-300">
        <span className="font-mono text-[11px] text-muted-text uppercase tracking-widest border-b border-terminal-border/40 pb-3 mb-4">
          Sentiment Distribution
        </span>
        <SentimentChart positive={positive} negative={negative} />
      </div>

      {/* Reliability Breakdown Card */}
      <div className="bg-terminal-card border border-terminal-border p-6 rounded-[4px] flex flex-col glow-border-hover transition-all duration-300 justify-between">
        <span className="font-mono text-[11px] text-muted-text uppercase tracking-widest border-b border-terminal-border/40 pb-3 mb-4">
          Reliability Breakdown
        </span>
        <div className="flex-1 flex items-center justify-center">
          <ReliabilityChart
            high={highPct}
            medium={mediumPct}
            low={lowPct}
          />
        </div>
      </div>

    </div>
  );
}
