import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="relative w-full h-[320px] bg-terminal-card border border-terminal-border rounded-[3px] overflow-hidden flex flex-col justify-between p-6 select-none font-mono">
      {/* Telemetry Header */}
      <div className="flex justify-between items-center border-b border-terminal-border/40 pb-4 text-[10px] text-accent-cyan">
        <span className="font-bold tracking-widest uppercase">SYS_INFERENCE // ACTIVE</span>
        <span className="text-muted-text">[STREAMING]</span>
      </div>

      {/* Sensor readouts */}
      <div className="flex-1 py-6 flex flex-col gap-4 text-[11px] text-muted-text/80">
        <div className="flex justify-between border-b border-terminal-border/20 pb-1">
          <span>VECTOR_TENSOR_MAPPING</span>
          <span className="text-accent-cyan font-bold">COMPILING</span>
        </div>
        <div className="flex justify-between border-b border-terminal-border/20 pb-1">
          <span>TFIDF_VOCABULARY_SCAN</span>
          <span className="text-accent-green font-bold">SUCCESS</span>
        </div>
        <div className="flex justify-between border-b border-terminal-border/20 pb-1">
          <span>CALIBRATED_MARGIN_svm</span>
          <span className="text-accent-amber font-bold">INFERRING...</span>
        </div>
      </div>

      {/* Target status indicators */}
      <div className="flex justify-between items-center text-[10px] text-muted-text">
        <span>RESOLVING SENTIMENT INDEX</span>
        <span className="bg-[#1A1400] text-accent-amber border border-[rgba(255,184,0,0.2)] px-2 py-0.5 rounded-[2px] font-bold">
          PROCESSING
        </span>
      </div>
    </div>
  );
}
