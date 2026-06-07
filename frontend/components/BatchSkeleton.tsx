import React from "react";

export default function BatchSkeleton() {
  return (
    <div className="relative w-full h-[400px] bg-terminal-card border border-terminal-border rounded-[3px] overflow-hidden flex flex-col justify-between p-6 select-none font-mono">
      <div className="flex justify-between items-center border-b border-terminal-border/40 pb-4 text-[10px] text-accent-cyan">
        <span className="font-bold tracking-widest">BATCH_INFERENCE // PROCESSING_MATRIX</span>
        <span className="text-muted-text">[STREAMING]</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
        {["RECORDS_SCRUB", "TOKEN_LEMMA", "MATRIX_PARSE", "CLASSIFIER_RUN"].map((lbl, i) => (
          <div key={i} className="border border-terminal-border bg-terminal-border/10 p-4 rounded-[3px] flex flex-col justify-between h-16">
            <span className="text-[9px] text-muted-text">{lbl}</span>
            <span className="text-[11px] text-accent-cyan font-bold">PARSING</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1 text-[11px] text-muted-text/80">
        <div className="border border-terminal-border/40 bg-[#0A0A0F]/50 p-4 rounded-[3px] flex flex-col justify-between h-full min-h-[140px]">
          <span>COMPILING ASPECT COMPLAINTS GRAPH...</span>
          <span className="text-accent-coral font-bold">EXTRACTING...</span>
        </div>
        <div className="border border-terminal-border/40 bg-[#0A0A0F]/50 p-4 rounded-[3px] flex flex-col justify-between h-full min-h-[140px]">
          <span>COMPILING PRAISED COMPLIANCE MAP...</span>
          <span className="text-accent-green font-bold">CALCULATING...</span>
        </div>
      </div>
    </div>
  );
}
