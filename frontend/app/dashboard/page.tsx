"use client";

import React, { useEffect, useState } from "react";
import { getStats } from "../../lib/api";
import { StatsResponse } from "../../lib/types";

import StatCard from "../../components/StatCard";
import SentimentChart from "../../components/SentimentChart";
import ModelTable from "../../components/ModelTable";
import ReliabilityChart from "../../components/ReliabilityChart";
import DashboardSkeleton from "../../components/DashboardSkeleton";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err: any) {
      setError("Failed to load dashboard. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalReviews = stats?.dataset_summary.total_reviews ?? 0;
  const avgConfidence = stats?.avg_confidence 
    ? `${Math.round(stats.avg_confidence * 100)}%` 
    : "0%";
  const highReliability = stats?.reliability_summary.high_confidence_percentage 
    ? `${Math.round(stats.reliability_summary.high_confidence_percentage)}%` 
    : "0%";
  const datasetSource = stats?.dataset_summary.source 
    ? stats.dataset_summary.source.split(" ")[2] || "AMAZON"
    : "N/A";

  const failureModes = [
    { category: "MIXED_SENTIMENT", example: "The camera is nice but the app crashes constantly and battery life is completely [REDACTED]." },
    { category: "SARCASM", example: "Oh fantastic, another charger that broke after exactly two days of light use." },
    { category: "COMPARATIVE", example: "It has slightly better sound than my old pair, but is nowhere near as [REDACTED]." },
    { category: "SHORT_REVIEW", example: "Terrible." },
    { category: "NEGATION_FAILURE", example: "I don't dislike the design but I cannot say it is worth the high price." }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8 select-none">
      
      {/* Title section */}
      <div className="flex flex-col gap-1 border-b border-terminal-border/40 pb-4">
        <div className="font-mono text-[13px] font-bold tracking-[0.2em] text-accent-cyan uppercase glow-text-cyan">
          SYSTEM_METRICS // DASHBOARD
        </div>
        <p className="font-sans text-[12px] text-muted-text uppercase tracking-wider">Model Performance & Dataset Overview</p>
      </div>

      {error && (
        <div className="w-full border border-accent-coral/60 bg-[#1A0000] p-4 rounded-[4px] font-mono text-[12px] text-accent-coral flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-accent-coral text-black font-mono text-[10px] font-bold uppercase tracking-wider rounded-[3px] hover:brightness-105"
          >
            RETRY
          </button>
        </div>
      )}

      {isLoading ? (
        <DashboardSkeleton />
      ) : stats ? (
        <>
          {/* Stat Cards Grid (3-column layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Reviews"
              value={totalReviews.toLocaleString()}
            />
            <StatCard
              title="Avg Confidence"
              value={avgConfidence}
            />
            <StatCard
              title="High Reliability"
              value={highReliability}
            />
            <div className="md:col-span-3 lg:col-span-1">
              <StatCard 
                title="Dataset Source"
                value={datasetSource}
              />
            </div>
          </div>

          {/* Charts Section (2-column layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            
            {/* Sentiment Chart Card */}
            <div className="bg-terminal-card border border-terminal-border p-6 rounded-[4px] flex flex-col glow-border-hover transition-all duration-300">
              <span className="font-mono text-[11px] text-muted-text uppercase tracking-widest border-b border-terminal-border/40 pb-3 mb-4">
                Sentiment Distribution
              </span>
              <SentimentChart 
                positive={stats.dataset_summary.positive_count} 
                negative={stats.dataset_summary.negative_count} 
              />
            </div>

            {/* Reliability Breakdown Card */}
            <div className="bg-terminal-card border border-terminal-border p-6 rounded-[4px] flex flex-col glow-border-hover transition-all duration-300 justify-between">
              <span className="font-mono text-[11px] text-muted-text uppercase tracking-widest border-b border-terminal-border/40 pb-3 mb-4">
                Reliability Breakdown
              </span>
              <div className="flex-1 flex items-center justify-center">
                <ReliabilityChart
                  high={stats.reliability_summary.high_confidence_percentage}
                  medium={stats.reliability_summary.medium_confidence_percentage}
                  low={stats.reliability_summary.low_confidence_percentage}
                />
              </div>
            </div>

          </div>

          {/* Model Comparison Table */}
          <div className="flex flex-col gap-4 mt-2">
            <span className="font-mono text-[11px] text-muted-text uppercase tracking-widest">
              Model Evaluation Matrix
            </span>
            <ModelTable models={stats.models} />
          </div>

          {/* Redacted Failure Modes Section */}
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-[4px] flex flex-col gap-4 mt-2 glow-border-hover transition-all duration-300 select-text">
            <span className="font-mono text-[11px] text-muted-text uppercase tracking-widest border-b border-terminal-border/40 pb-3">
              MODEL FAILURE MODES
            </span>
            
            <div className="flex flex-col border border-terminal-border rounded-[4px] overflow-hidden font-mono text-[12px]">
              
              {/* Header row */}
              <div className="grid grid-cols-3 bg-terminal-border/20 px-4 py-2 text-[10px] font-bold text-muted-text uppercase tracking-widest border-b border-terminal-border">
                <div className="col-span-1">Category</div>
                <div className="col-span-2">Redacted Scenario Example</div>
              </div>

              {/* Data rows */}
              {failureModes.map((fm, idx) => (
                <div 
                  key={idx} 
                  className="grid grid-cols-3 px-4 py-3 border-b border-terminal-border last:border-0 hover:bg-[#1A1A2E]/70 transition-colors duration-150 items-center"
                >
                  <div className="col-span-1 font-bold text-accent-cyan tracking-wider">
                    {fm.category}
                  </div>
                  <div className="col-span-2 text-body-text italic">
                    "{fm.example}"
                  </div>
                </div>
              ))}

            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
