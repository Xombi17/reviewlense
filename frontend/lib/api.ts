/**
 * API client module with typed functions for backend endpoints.
 * All functions use native fetch API and return properly typed responses.
 */

import {
  PredictRequest,
  PredictResponse,
  StatsResponse,
  BatchResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Analyze a single review for sentiment, aspects, and reliability.
 * POST /predict
 *
 * @param review - The review text to analyze (3–5000 characters)
 * @param model - Optional model to use: "lr" (default), "nb", or "svm"
 * @returns Promise<PredictResponse> - Sentiment, confidence, aspects, and reliability flags
 * @throws Error if the request fails or backend returns an error
 */
export async function analyzeReview(
  review: string,
  model?: "lr" | "nb" | "svm"
): Promise<PredictResponse> {
  const url = `${API_BASE}/predict`;

  const request: PredictRequest = {
    review,
    ...(model && { model }),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(
        `Failed to analyze review: ${error.detail || response.statusText}`
      );
    }

    const data: PredictResponse = await response.json();
    return data;
  } catch (error) {
    console.error("analyzeReview error:", error);
    throw error;
  }
}

/**
 * Retrieve statistics about the dataset and models.
 * GET /stats
 *
 * @returns Promise<StatsResponse> - Dataset summary, model metrics, reliability breakdown
 * @throws Error if the request fails or backend returns an error
 */
export async function getStats(): Promise<StatsResponse> {
  const url = `${API_BASE}/stats`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(
        `Failed to fetch stats: ${error.detail || response.statusText}`
      );
    }

    const data: StatsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("getStats error:", error);
    throw error;
  }
}

/**
 * Upload and process a batch of reviews from a CSV file.
 * POST /batch
 *
 * @param file - CSV file with "reviewText" column
 * @returns Promise<BatchResponse> - Batch processing results including sentiment distribution
 * @throws Error if the request fails or backend returns an error
 */
export async function uploadBatch(file: File): Promise<BatchResponse> {
  const url = `${API_BASE}/batch`;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      // DO NOT set Content-Type header — browser will set multipart/form-data with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(
        `Failed to upload batch: ${error.detail || response.statusText}`
      );
    }

    const data: BatchResponse = await response.json();
    return data;
  } catch (error) {
    console.error("uploadBatch error:", error);
    throw error;
  }
}
