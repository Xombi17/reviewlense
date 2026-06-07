import React from "react";
import Link from "next/link";

export const metadata = {
  title: "ReviewLens AI - Sentiment Intelligence Terminal",
  description: "A dark-mode analytics console featuring high-confidence aspect sentiment extraction, uncertainty calibration, and spam review heuristics.",
};

export default function LandingPage() {
  const stats = [
    { label: "TOTAL DATABASE DATASETS", value: "19,418" },
    { label: "SVM CLASSIFIER ACCURACY", value: "94.95%" },
    { label: "AVERAGE INFERENCE SPEED", value: "84 ms" },
    { label: "ACTIVE NLP NODES", value: "128 / 128" },
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
    <div className="w-full min-h-[calc(100vh-56px)] flex flex-col justify-between py-12 px-6 select-none font-mono">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center gap-12">
        
        {/* Hero Section */}
        <div className="flex flex-col gap-6 text-center md:text-left md:max-w-3xl animate-fade-up">
          <div className="text-[11px] text-accent-cyan font-bold tracking-[0.25em] uppercase glow-text-cyan">
            REVIEWLENS_AI // PROTOCOL_V1.0
          </div>
          <h1 className="font-mono text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight uppercase">
            Sentiment Analysis with <span className="text-accent-cyan glow-text-cyan">Absolute Precision</span>
          </h1>
          <p className="font-sans text-[14px] sm:text-[16px] text-muted-text max-w-xl leading-relaxed">
            A calibrated review analytics console featuring aspect-level polarity extraction, prediction reliability verification, and heuristic trust scoring.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center md:justify-start">
            <Link 
              href="/analyzer"
              className="h-12 px-8 bg-accent-cyan text-black font-mono text-[12px] font-bold uppercase tracking-[0.15em] rounded-[4px] flex items-center justify-center transition-all duration-200 hover:brightness-105 hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] cursor-pointer"
            >
              LAUNCH ANALYZER
            </Link>
            <Link 
              href="/batch"
              className="h-12 px-8 border border-terminal-border bg-terminal-card hover:bg-terminal-border/20 text-white font-mono text-[12px] font-bold uppercase tracking-[0.15em] rounded-[4px] flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              CSV BATCH CONSOLE
            </Link>
          </div>
        </div>

        {/* Live Telemetry Bar */}
        <div className="hud-card grid grid-cols-2 lg:grid-cols-4 gap-6 bg-terminal-card border border-terminal-border p-6 rounded-[4px] w-full animate-fade-up" style={{ animationDelay: "100ms" }}>
          {stats.map((st, i) => (
            <div key={i} className="flex flex-col gap-1 border-r border-terminal-border/30 last:border-0 pr-4">
              <span className="text-[9px] text-muted-text uppercase tracking-widest">{st.label}</span>
              <span className="text-[20px] font-bold text-white tracking-tighter glow-text-cyan">{st.value}</span>
            </div>
          ))}
        </div>

        {/* Core Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fade-up" style={{ animationDelay: "200ms" }}>
          {features.map((ft, i) => (
            <div key={i} className="hud-card bg-terminal-card border border-terminal-border p-6 rounded-[4px] flex flex-col gap-3 glow-border-hover transition-all duration-300">
              <div className="flex justify-between items-center border-b border-terminal-border/40 pb-2">
                <span className={`text-[10px] font-bold tracking-widest ${ft.color}`}>{ft.code}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/80 animate-pulse-dot" />
              </div>
              <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">{ft.title}</h3>
              <p className="font-sans text-[12px] text-muted-text leading-relaxed">{ft.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Footer System Status */}
      <div className="max-w-6xl mx-auto w-full border-t border-terminal-border/30 pt-6 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted-text tracking-widest">
        <span>REVIEWLENS AI TERMINAL OPERATIONAL</span>
        <span>2026-06-07 // GMT-0</span>
      </div>
    </div>
  );
}
