/**
 * TypeScript interfaces mirroring backend Pydantic schemas.
 * These types ensure type safety across the frontend and establish
 * contracts with the backend API.
 */

/**
 * Aspect-level sentiment analysis result.
 */
export interface AspectSentiment {
  aspect: string;
  sentiment: 0 | 1;
  confidence: number;
}

/**
 * Request body for POST /predict endpoint.
 */
export interface PredictRequest {
  review: string;
  model?: "lr" | "nb";
}

/**
 * Response from POST /predict endpoint.
 * Contains overall sentiment, aspects, trust score, and reliability flags.
 */
export interface PredictResponse {
  sentiment: 0 | 1;
  confidence: number;
  reliability: "HIGH" | "MEDIUM" | "LOW";
  aspects: AspectSentiment[];
  trust_score: number;
  flags: string[];
  model_used: "lr" | "nb";
}

/**
 * Summary statistics about the training dataset.
 */
export interface DatasetSummary {
  total_reviews: number;
  positive_count: number;
  negative_count: number;
  positive_percentage: number;
  negative_percentage: number;
  source: string;
}

/**
 * Performance metrics for a single ML model.
 */
export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  name: string;
  is_default: boolean;
}

/**
 * Distribution of prediction confidence levels across the dataset.
 */
export interface ReliabilitySummary {
  high_confidence_percentage: number;
  medium_confidence_percentage: number;
  low_confidence_percentage: number;
}

/**
 * Response from GET /stats endpoint.
 * Contains dataset summary, model metrics, and reliability breakdowns.
 */
export interface StatsResponse {
  dataset_summary: DatasetSummary;
  models: Record<string, ModelMetrics>;
  reliability_summary: ReliabilitySummary;
  failure_modes: Record<string, number>;
  total_reviews: number;
  avg_confidence: number;
}

/**
 * Derived data used by the dashboard components.
 */
export interface DashboardStats {
  totalReviews: number;
  positivePercentage: number;
  negativePercentage: number;
  datasetSource: string;
  positiveCount: number;
  negativeCount: number;
  models: Array<{
    name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    is_default: boolean;
  }>;
  reliability: {
    high: number;
    medium: number;
    low: number;
  };
  failureTypes: Record<string, number>;
}

/**
 * A single review item in batch processing results.
 */
export interface BatchReviewItem {
  review: string;
  confidence: number;
}

/**
 * Response from POST /batch endpoint.
 * Contains batch processing statistics and identified concerns/praised items.
 */
export interface BatchResponse {
  total: number;
  processed: number;
  skipped: number;
  sentiment_distribution: Record<string, number>;
  avg_confidence: number;
  top_complaints: BatchReviewItem[];
  top_praised: BatchReviewItem[];
  suspicious_count: number;
  reliability_breakdown: Record<string, number>;
}
