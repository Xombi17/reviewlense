"use client";

import React, { useState } from "react";
import UploadZone from "../../components/UploadZone";
import BatchSummary from "../../components/BatchSummary";
import BatchCharts from "../../components/BatchCharts";
import TopReviewsList from "../../components/TopReviewsList";
import BatchSkeleton from "../../components/BatchSkeleton";
import { uploadBatch } from "../../lib/api";
import { BatchResponse } from "../../lib/types";

export default function BatchPage() {
  const [results, setResults] = useState<BatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    // Pre-validate file size: 5MB limit
    const fiveMegabytes = 5 * 1024 * 1024;
    if (file.size > fiveMegabytes) {
      setError("File exceeds 5MB limit");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await uploadBatch(file);
      setResults(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload batch";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Batch Analysis
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Upload a CSV file to analyze multiple reviews at once
        </p>
      </div>

      {/* Upload zone — shown only when there are no results and not loading */}
      {!results && !isLoading && (
        <UploadZone
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          error={error}
          onErrorDismiss={() => setError(null)}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && <BatchSkeleton />}

      {/* Results */}
      {results && !isLoading && (
        <>
          {/* Summary cards */}
          <BatchSummary results={results} />

          {/* Charts */}
          <BatchCharts results={results} />

          {/* Top reviews */}
          <TopReviewsList
            topComplaints={results.top_complaints}
            topPraised={results.top_praised}
          />

          {/* Skipped reviews warning */}
          {results.skipped > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-800 dark:text-yellow-300 text-sm">
              ⚠️{" "}
              <strong>{results.skipped}</strong> review(s) were skipped (empty
              or invalid)
            </div>
          )}

          {/* Upload Another File button */}
          <button
            onClick={handleReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Upload Another File
          </button>
        </>
      )}
    </main>
  );
}
