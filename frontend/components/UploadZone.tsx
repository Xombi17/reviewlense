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

  const containerClasses = [
    "border-2 border-dashed rounded-lg p-6 md:p-8 lg:p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500",
    isDragging
      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50",
    isLoading ? "opacity-50 cursor-not-allowed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-4 w-full">
      {error && (
        <div 
          className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between gap-4 font-medium transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm md:text-base text-red-600 dark:text-red-400">{error}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onErrorDismiss?.();
            }}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div
        className={containerClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
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

        {/* Upload icon */}
        <svg
          className="w-12 h-12 md:w-16 md:h-16 text-gray-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>

        {/* Primary text */}
        <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm md:text-base">
          Drag CSV here or click to browse
        </p>

        {/* Hint text */}
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          CSV must contain &ldquo;reviewText&rdquo; column • Max 5MB • Max 2000 rows
        </p>
      </div>
    </div>
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }
}

