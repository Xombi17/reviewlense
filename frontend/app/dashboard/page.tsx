"use client";

import React, { useEffect, useState } from "react";
import { getStats } from "../../lib/api";
import { StatsResponse } from "../../lib/types";

import StatCard from "../../components/StatCard";
import SentimentChart from "../../components/SentimentChart";
import ModelTable from "../../components/ModelTable";
import ReliabilityChart from "../../components/ReliabilityChart";
import FailureTypesChart from "../../components/FailureTypesChart";
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
      // Keep old stats if we have them to avoid sudden blank page
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalReviews = stats?.dataset_summary.total_reviews ?? 0;
  const positivePercentage = totalReviews > 0 ? ((stats?.dataset_summary.positive_count ?? 0) / totalReviews) * 100 : 0;
  const negativePercentage = totalReviews > 0 ? ((stats?.dataset_summary.negative_count ?? 0) / totalReviews) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Model Performance & Dataset Overview</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-center justify-between gap-4 font-medium transition-all duration-300">
          <span>{error}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Refresh
            </button>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <DashboardSkeleton />
      ) : stats ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Total Reviews"
              value={stats.dataset_summary.total_reviews}
              unit="reviews"
            />
            <StatCard
              title="Positive"
              value={stats.dataset_summary.positive_count}
              unit={`(${positivePercentage.toFixed(2)}%)`}
            />
            <StatCard
              title="Negative"
              value={stats.dataset_summary.negative_count}
              unit={`(${negativePercentage.toFixed(2)}%)`}
            />
            <StatCard 
              title="Dataset Source"
              value={stats.dataset_summary.source}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sentiment Distribution</h2>
              <div className="w-full h-[300px] md:h-[400px]">
                <SentimentChart positive={stats.dataset_summary.positive_count} negative={stats.dataset_summary.negative_count} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reliability Breakdown</h2>
              <div className="w-full h-[300px] md:h-[400px]">
                <ReliabilityChart
                  high={stats.reliability_summary.high_confidence_percentage}
                  medium={stats.reliability_summary.medium_confidence_percentage}
                  low={stats.reliability_summary.low_confidence_percentage}
                />
              </div>
            </div>
          </div>

          {/* Model Comparison */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Model Comparison</h2>
            <div className="overflow-x-auto">
              <ModelTable models={stats.models} />
            </div>
          </div>

          {/* Failure Analysis */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Failure Type Analysis</h2>
            <div className="w-full h-[300px] md:h-[400px]">
              <FailureTypesChart failureTypes={stats.failure_modes} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
