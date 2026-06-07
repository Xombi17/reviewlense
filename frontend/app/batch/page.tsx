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
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8 select-none">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-terminal-border/40 pb-4">
        <div className="font-mono text-[13px] font-bold tracking-[0.2em] text-accent-cyan uppercase glow-text-cyan">
          BATCH_SYSTEM // Uploader
        </div>
        <p className="font-sans text-[12px] text-muted-text uppercase tracking-wider">
          Upload a CSV file to analyze multiple reviews at once
        </p>
      </div>

      {/* Upload Zone */}
      {!results && !isLoading && (
        <UploadZone
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          error={error}
          onErrorDismiss={() => setError(null)}
        />
      )}

      {/* Loading Radar Sweep */}
      {isLoading && <BatchSkeleton />}

      {/* Results View */}
      {results && !isLoading && (
        <div className="flex flex-col gap-8 animate-fade-up">
          {/* Summary Cards Row */}
          <BatchSummary results={results} />

          {/* Charts Row */}
          <BatchCharts results={results} />

          {/* Complaints / Praised Aspect Chips Grid */}
          <TopReviewsList
            topComplaints={results.top_complaints}
            topPraised={results.top_praised}
          />

          {/* Warning Message Box for Skipped Rows */}
          {results.skipped > 0 && (
            <div className="border border-accent-amber/40 bg-[rgba(255,184,0,0.08)] p-4 rounded-[4px] font-mono text-[12px] text-accent-amber flex items-center gap-2 select-text">
              <span>⚠</span>
              <span>
                <strong>{results.skipped}</strong> input review record(s) skipped due to formatting anomalies or null content.
              </span>
            </div>
          )}

          {/* Upload Another File Button */}
          <button
            onClick={handleReset}
            className="w-full h-12 border border-terminal-border bg-terminal-card hover:bg-terminal-border/20 text-white font-mono text-[12px] font-bold uppercase tracking-[0.15em] rounded-[4px] mt-4 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
}
