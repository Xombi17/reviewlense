import React from "react";

export default function BatchSkeleton() {
  return (
    <div className="relative w-full h-[400px] bg-terminal-card border border-terminal-border rounded-[4px] overflow-hidden flex flex-col justify-between p-6 select-none font-mono">
      <div className="flex justify-between items-center border-b border-terminal-border/40 pb-4 text-[10px] text-accent-cyan">
        <span className="font-bold tracking-widest animate-pulse">BATCH_RADAR // PROCESSING_MATRIX</span>
        <span className="text-muted-text">[ROWS_LIMIT: 2000 // STREAM: ACTIVE]</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
        {["RECORDS_SCRUB", "TOKEN_LEMMA", "MATRIX_PARSE", "CLASSIFIER_RUN"].map((lbl, i) => (
          <div key={i} className="border border-terminal-border bg-terminal-border/10 p-4 rounded-[3px] flex flex-col justify-between h-16 animate-pulse">
            <span className="text-[9px] text-muted-text">{lbl}</span>
            <span className="text-[11px] text-accent-cyan font-bold">CALIBRATING</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1 text-[11px] text-muted-text/80">
        <div className="border border-terminal-border/40 bg-[#0A0A0F]/50 p-4 rounded-[3px] flex flex-col justify-between h-full min-h-[140px]">
          <span>COMPILING ASPECT COMPLAINTS GRAPH...</span>
          <span className="text-accent-coral font-bold animate-pulse">EXTRACTING ASPECT CHIPS</span>
        </div>
        <div className="border border-terminal-border/40 bg-[#0A0A0F]/50 p-4 rounded-[3px] flex flex-col justify-between h-full min-h-[140px]">
          <span>COMPILING PRAISED COMPLIANCE MAP...</span>
          <span className="text-accent-green font-bold animate-pulse">CALCULATING ACCURACY WEIGHTS</span>
        </div>
      </div>
      
      {/* Sweep Scan Line */}
      <div className="absolute top-0 bottom-0 w-[150px] bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.18)] to-transparent border-r-2 border-accent-cyan/80 pointer-events-none animate-sweep" />
    </div>
  );
}
