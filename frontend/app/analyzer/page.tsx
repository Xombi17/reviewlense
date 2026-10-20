"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { analyzeReview, fetchModels, FALLBACK_MODELS } from '../../lib/api';
import type { ModelId, ModelInfo, PredictResponse } from '../../lib/types';

import SentimentBadge from '../../components/SentimentBadge';
import ConfidenceBar from '../../components/ConfidenceBar';
import ReliabilityTag from '../../components/ReliabilityTag';
import AspectChips from '../../components/AspectChips';
import FlagsList from '../../components/FlagsList';
import TrustScoreCircle from '../../components/TrustScoreCircle';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ExampleChips from '../../components/ExampleChips';

export default function AnalyzerPage() {
  const [review, setReview] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelId>("lr");
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK_MODELS);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);

  // Ask the backend which models it offers (the transformer is optional).
  useEffect(() => {
    let active = true;
    fetchModels().then((available) => {
      if (active) setModels(available);
    });
    return () => {
      active = false;
    };
  }, []);

  // Pipeline steps shown while loading; they describe what the selected model really does.
  const steps = selectedModel === "transformer"
    ? [
        { label: "READ", desc: "Raw Text, No Cleaning" },
        { label: "TOKEN", desc: "Subword Tokenization" },
        { label: "ENCODE", desc: "Transformer Encoder" },
        { label: "INFERENCE", desc: "Temperature-Calibrated Estimate" }
      ]
    : [
        { label: "CLEAN", desc: "HTML & URL Scrubbing" },
        { label: "TOKEN", desc: "Lemmatization & Negations" },
        { label: "VECTOR", desc: "TF-IDF Matrix Mapping" },
        { label: "INFERENCE", desc: "Probability Estimate" }
      ];

  // Animate steps during loading
  useEffect(() => {
    if (isLoading) {
      setActiveStep(0);
      const timers = [
        setTimeout(() => setActiveStep(1), 500),
        setTimeout(() => setActiveStep(2), 1000),
        setTimeout(() => setActiveStep(3), 1500),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setActiveStep(-1);
    }
  }, [isLoading]);

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

  return (
    <div className="w-full min-h-[calc(100vh-56px)] flex items-center justify-center p-6 select-none animate-fade-up">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-stretch">
        
        {/* Left 45%: Input Panel */}
        <div className="w-full md:w-[45%] flex flex-col justify-between bg-terminal-card border border-terminal-border p-6 rounded-[3px] relative hover-border-transition transition-all duration-300">
          <div className="flex flex-col gap-6">
            {/* Wordmark */}
            <div className="font-mono text-[13px] font-bold tracking-[0.2em] text-white uppercase">
              ReviewLens AI // ANALYZER
            </div>

            {/* Model Selector Pills */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">Select Model</span>
              <div className="flex gap-2 w-full">
                {models.map(({ id: m, name }) => (
                  <button
                    key={m}
                    type="button"
                    title={name}
                    onClick={() => setSelectedModel(m)}
                    disabled={isLoading}
                    className={`flex-1 py-2 font-mono text-[11px] font-bold uppercase tracking-wider rounded-[3px] border transition-all duration-200 cursor-pointer ${
                      selectedModel === m
                        ? "border-accent-cyan text-accent-cyan bg-accent-cyan/10"
                        : "border-terminal-border bg-terminal-border text-muted-text hover:text-white"
                    }`}
                  >
                    {m === "lr" ? "LR" : m === "nb" ? "NB" : "Transformer"}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">Input Text</span>
              <textarea
                value={review}
                onChange={(e) => {
                  setReview(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder="paste a product review..."
                className="w-full min-h-[160px] bg-[#0D0D14] border-l-2 border-accent-cyan/80 border-y-0 border-r-0 p-4 font-mono text-[14px] text-body-text placeholder-muted-text focus:outline-none focus:bg-[#0E0E18] disabled:opacity-50 resize-none"
              />
            </div>

            {/* Example Chips */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">Quick Templates</span>
              <ExampleChips onChipClick={handleExampleClick} />
            </div>

            {/* AI Neural Pipeline Map */}
            <div className="border border-terminal-border/40 bg-[#0A0A0F]/50 p-4 rounded-[3px] flex flex-col gap-3 font-mono">
              <span className="text-[9px] text-muted-text uppercase tracking-widest">Neural Pipeline Signals</span>
              <div className="grid grid-cols-4 gap-1 relative">
                {steps.map((st, i) => {
                  const isActive = activeStep >= i;
                  const isCurrent = activeStep === i;
                  return (
                    <div 
                      key={i} 
                      className={`flex flex-col items-center text-center p-1.5 border rounded-[3px] transition-all duration-300 ${
                        isCurrent 
                          ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan" 
                          : isActive 
                            ? "border-accent-green/40 bg-accent-green/5 text-accent-green" 
                            : "border-terminal-border text-muted-text/40"
                      }`}
                    >
                      <span className="text-[10px] font-bold tracking-tight">{st.label}</span>
                      <span className="text-[7px] text-muted-text/80 hidden sm:block mt-0.5">{st.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={review.trim().length < 10 || isLoading}
            className="w-full h-12 bg-white text-black font-mono text-[12px] font-bold uppercase tracking-[0.15em] rounded-[3px] mt-6 transition-colors hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? "ANALYZING..." : "ANALYZE"}
          </button>
        </div>

        {/* Right 55%: Results Panel */}
        <div className="w-full md:w-[55%] flex flex-col justify-center bg-terminal-card border border-terminal-border p-6 rounded-[3px] min-h-[420px] relative hover-border-transition transition-all duration-300">
          
          {isLoading && (
            <div className="absolute inset-0 p-6 bg-terminal-card z-10">
              <LoadingSkeleton />
            </div>
          )}

          {error && (
            <div className="w-full border border-accent-coral/60 bg-[#1A0000] p-4 rounded-[3px] font-mono text-[12px] text-accent-coral flex items-start gap-2 select-text">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {!prediction && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div className="font-mono text-[12px] text-muted-text uppercase tracking-widest">
                System Idle // Awaiting Input Signal
              </div>
              <div className="font-mono text-[11px] text-muted-text/60 mt-2">
                Paste a review and select a model to generate analysis.
              </div>
            </div>
          )}

          {prediction && !isLoading && !error && (
            <div className={`flex flex-col gap-6 transition-all duration-500 transform ${
              showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}>
              
              {/* Header Status */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-terminal-border pb-4">
                <SentimentBadge sentiment={prediction.sentiment} />
                <ReliabilityTag reliability={prediction.reliability} />
              </div>

              {/* Confidence Meter */}
              <ConfidenceBar confidence={prediction.confidence} sentiment={prediction.sentiment} />

              {/* Aspects and Trust Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start mt-2">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">EXTRACTED ASPECTS</span>
                    <AspectChips aspects={prediction.aspects} />
                  </div>
                </div>

                <div className="flex justify-start sm:justify-center">
                  <TrustScoreCircle score={prediction.trust_score} />
                </div>
              </div>

              {/* Flags Section */}
              <div className="flex flex-col gap-2 border-t border-terminal-border/40 pt-4 mt-2">
                <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">RELIABILITY FLAGS</span>
                <FlagsList flags={prediction.flags} />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
