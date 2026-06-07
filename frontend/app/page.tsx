import React from "react";
import Link from "next/link";
import { fetchStats } from "../lib/api";

export const metadata = {
  title: "ReviewLens AI - Sentiment Intelligence Console",
  description: "A minimalistic analytics console featuring high-confidence aspect sentiment extraction, uncertainty calibration, and spam review heuristics.",
};

export default async function LandingPage() {
  let statsData = null;
  try {
    statsData = await fetchStats();
  } catch (err) {
    // Graceful fallback for build-time or backend offline
  }

  const totalReviews = statsData?.total_reviews 
    ? statsData.total_reviews.toLocaleString() 
    : "19,418";
  
  const svmAccuracy = statsData?.models?.svm?.accuracy 
    ? `${(statsData.models.svm.accuracy * 100).toFixed(2)}%` 
    : "94.95%";

  const avgConfidence = statsData?.avg_confidence 
    ? `${Math.round(statsData.avg_confidence * 100)}%` 
    : "92%";

  const datasetSource = statsData?.dataset_summary?.source 
    ? statsData.dataset_summary.source.split(" ")[2] || "AMAZON"
    : "AMAZON";

  const stats = [
    { label: "TOTAL DATABASE DATASETS", value: totalReviews },
    { label: "SVM CLASSIFIER ACCURACY", value: svmAccuracy },
    { label: "AVG INFERENCE CONFIDENCE", value: avgConfidence },
    { label: "DATABASE SOURCE", value: datasetSource },
  ];

  const features = [
    {
      code: "01 // MULTI_MODEL",
      title: "Tri-Model Inference Matrix",
      desc: "Simultaneous evaluation across Multinomial Naive Bayes, Logistic Regression, and Calibrated Linear SVM algorithms with live margin offsets.",
      color: "text-accent-cyan"
    },
    {
      code: "02 // ASPECT_POLAR",
      title: "Granular Aspect Mapping",
      desc: "Deconstructs sentences to extract sentiment indicators on individual product parameters (e.g. sound quality, battery parameters, micro-connectivity).",
      color: "text-accent-green"
    },
    {
      code: "03 // RELIABILITY_CAL",
      title: "Uncertainty Margin Calibration",
      desc: "Classifies predictions into High, Medium, and Low confidence thresholds. Flags mixed sentiment anomalies and edge case warnings.",
      color: "text-accent-amber"
    },
    {
      code: "04 // SPAM_HEURISTICS",
      title: "Trust Index Evaluation",
      desc: "Scores text integrity based on lexical repetitions, shouting patterns (caps-screaming), and word length boundaries to weed out review noise.",
      color: "text-accent-coral"
    }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-56px)] flex flex-col justify-between py-16 px-6 font-mono">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center gap-14 animate-fade-up">
        
        {/* Hero Section */}
        <div className="flex flex-col gap-6 max-w-2xl text-left">
          <div className="text-[10px] text-accent-cyan font-bold tracking-[0.25em] uppercase">
            SYSTEM_OVERVIEW // PROTOCOL_1.0
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight uppercase">
            Sentiment Analysis with <span className="text-accent-cyan">Calibrated Precision</span>
          </h1>
          <p className="font-sans text-[14px] text-muted-text max-w-xl leading-relaxed">
            An authoritative, minimal analytics console featuring aspect-level polarity extraction, prediction reliability verification, and heuristic spam filters.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link 
              href="/analyzer"
              className="h-10 px-6 bg-white hover:bg-zinc-200 text-black font-mono text-[11px] font-bold uppercase tracking-wider rounded-[3px] flex items-center justify-center transition-colors cursor-pointer"
            >
              LAUNCH ANALYZER
            </Link>
            <Link 
              href="/batch"
              className="h-10 px-6 border border-terminal-border bg-terminal-card hover:border-zinc-800 text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-[3px] flex items-center justify-center transition-colors cursor-pointer"
            >
              CSV BATCH CONSOLE
            </Link>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-terminal-card border border-terminal-border p-6 rounded-[3px] w-full">
          {stats.map((st, i) => (
            <div key={i} className="flex flex-col gap-1 border-r border-terminal-border/40 last:border-0 pr-4">
              <span className="text-[9px] text-muted-text uppercase tracking-widest">{st.label}</span>
              <span className="text-[18px] font-bold text-white tracking-tight">{st.value}</span>
            </div>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {features.map((ft, i) => (
            <div key={i} className="bg-terminal-card border border-terminal-border p-6 rounded-[3px] flex flex-col gap-3 hover-border-transition">
              <div className="flex justify-between items-center border-b border-terminal-border/40 pb-2">
                <span className={`text-[10px] font-bold tracking-widest ${ft.color}`}>{ft.code}</span>
              </div>
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">{ft.title}</h3>
              <p className="font-sans text-[12px] text-muted-text leading-relaxed">{ft.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Footer System Status */}
      <div className="max-w-5xl mx-auto w-full border-t border-terminal-border/40 pt-6 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] text-muted-text tracking-widest">
        <span>CONSOLE STATE: NOMINAL</span>
        <span>2026-06-07 // CALIBRATED</span>
      </div>
    </div>
  );
}
