"use client";

import React, { useRef, useState } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

export default function UploadZone({ onFileSelect, isLoading, error, onErrorDismiss }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      {error && (
        <div className="w-full border border-accent-coral/60 bg-[#1A0000] p-4 rounded-[4px] font-mono text-[12px] text-accent-coral flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
          <button
            onClick={onErrorDismiss}
            className="text-accent-coral hover:text-white transition-colors duration-150 font-bold uppercase tracking-wider text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`group border-2 rounded-[4px] p-12 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all duration-300 min-h-[220px] ${
          isDragging
            ? "border-solid border-accent-cyan bg-accent-cyan/5 shadow-[0_0_15px_rgba(0,212,255,0.1)]"
            : "border-dashed border-terminal-border bg-terminal-card hover:border-accent-cyan hover:shadow-[0_0_12px_rgba(0,212,255,0.08)]"
        } ${isLoading ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          disabled={isLoading}
          onChange={handleFileChange}
        />

        {/* Grid/CSV Icon */}
        <svg 
          className="w-12 h-12 text-muted-text group-hover:text-accent-cyan transition-colors duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M3 10h18M3 14h18m-9-4v8m-5-8v8m10-8v8M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" 
          />
        </svg>

        {/* Primary text */}
        <p className="font-mono text-[13px] font-bold text-white uppercase tracking-wider group-hover:text-accent-cyan transition-colors duration-300">
          Drop CSV here or click to upload
        </p>

        {/* Constraints in muted mono */}
        <p className="font-mono text-[11px] text-muted-text">
          Max 5MB · 2000 rows · requires reviewText column
        </p>
      </div>
    </div>
  );
}
