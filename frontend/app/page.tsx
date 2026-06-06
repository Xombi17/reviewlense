"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { analyzeReview } from '../lib/api';
import type { PredictResponse } from '../lib/types';

import SentimentBadge from '../components/SentimentBadge';
import ConfidenceBar from '../components/ConfidenceBar';
import ReliabilityTag from '../components/ReliabilityTag';
import AspectChips from '../components/AspectChips';
import FlagsList from '../components/FlagsList';
import TrustScoreCircle from '../components/TrustScoreCircle';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ExampleChips from '../components/ExampleChips';

export default function Home() {
  const [review, setReview] = useState("");
  const [selectedModel, setSelectedModel] = useState<"lr" | "nb" | "svm">("lr");
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = useCallback(async () => {
    const trimmed = review.trim();
    if (trimmed.length < 10) return;

    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setShowResults(false);

    try {
      const result = await analyzeReview(trimmed, selectedModel);
      setPrediction(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze review");
    } finally {
      setIsLoading(false);
    }
  }, [review, selectedModel]);

  const handleExampleClick = useCallback((example: string) => {
    setReview(example);
    setError(null);
  }, []);

  useEffect(() => {
    if (prediction && !isLoading) {
      const timer = setTimeout(() => setShowResults(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [prediction, isLoading]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        ReviewLens Analyzer
      </h1>

      <div className="flex flex-col gap-4">
        <textarea
          value={review}
          onChange={(e) => {
            setReview(e.target.value);
            if (error) setError(null);
          }}
          disabled={isLoading}
          rows={6}
          placeholder="Enter a product review (10–5000 characters)..."
          className="w-full rounded-lg border-2 border-gray-300 p-4 font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as "lr" | "nb" | "svm")}
              disabled={isLoading}
              className="rounded-lg border-2 border-gray-300 py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 w-full sm:w-auto dark:bg-gray-800 dark:border-gray-700 dark:text-white hover:bg-gray-50 hover:border-gray-400 dark:hover:bg-gray-750"
            >
              <option value="lr">Logistic Regression</option>
              <option value="nb">Naive Bayes</option>
              <option value="svm">LinearSVM</option>
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={review.trim().length < 10 || isLoading}
            className="w-full sm:w-auto bg-blue-600 text-white rounded-lg py-2 px-6 font-semibold hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {!prediction && !isLoading && (
        <div className="mt-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Try an example
          </h2>
          <ExampleChips onChipClick={handleExampleClick} />
        </div>
      )}

      {isLoading && (
        <div className="mt-8">
          <LoadingSkeleton />
        </div>
      )}

      {error && (
        <div className="mt-8 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-3 rounded-lg flex items-center justify-between gap-4 font-medium transition-all duration-300">
          <span>{error}</span>
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
      )}


      {prediction && !isLoading && (
        <div className={`mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out transform ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Analysis Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <SentimentBadge sentiment={prediction.sentiment} />
                <ReliabilityTag reliability={prediction.reliability} />
              </div>
              
              <ConfidenceBar confidence={prediction.confidence} />
              
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Aspects</h3>
                <AspectChips aspects={prediction.aspects} />
              </div>
            </div>

            <div className="flex flex-col gap-6 items-start md:items-center md:border-l border-gray-200 dark:border-gray-700 md:pl-8">
              <TrustScoreCircle score={prediction.trust_score} />
              
              <div className="w-full">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 md:text-center">Flags</h3>
                <div className="flex md:justify-center">
                  <FlagsList flags={prediction.flags} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
