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
      setError(err.message || "Failed to fetch stats");
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Model Performance & Dataset Overview</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Model Performance & Dataset Overview</p>
        </div>
        <div className="bg-red-100 text-red-700 rounded-lg p-4 mb-6">
          <p>{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalReviews = stats.dataset.total_reviews;
  const positivePercentage = totalReviews > 0 ? (stats.dataset.positive_count / totalReviews) * 100 : 0;
  const negativePercentage = totalReviews > 0 ? (stats.dataset.negative_count / totalReviews) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Model Performance & Dataset Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Reviews" 
          value={stats.dataset.total_reviews} 
          unit="reviews" 
        />
        <StatCard 
          title="Positive" 
          value={stats.dataset.positive_count} 
          unit={`(${positivePercentage.toFixed(2)}%)`} 
        />
        <StatCard 
          title="Negative" 
          value={stats.dataset.negative_count} 
          unit={`(${negativePercentage.toFixed(2)}%)`} 
        />
        <StatCard 
          title="Dataset Source" 
          value={stats.dataset.source} 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sentiment Distribution</h2>
          <SentimentChart positive={stats.dataset.positive_count} negative={stats.dataset.negative_count} />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reliability Breakdown</h2>
          <ReliabilityChart 
            high={stats.reliability_breakdown.HIGH} 
            medium={stats.reliability_breakdown.MEDIUM} 
            low={stats.reliability_breakdown.LOW} 
          />
        </div>
      </div>

      {/* Model Comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Model Comparison</h2>
        <ModelTable models={stats.models} />
      </div>

      {/* Failure Analysis */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Failure Type Analysis</h2>
        <FailureTypesChart failureTypes={stats.failure_types} />
      </div>
    </div>
  );
}
