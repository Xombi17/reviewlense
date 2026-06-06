"""Pydantic schemas for GET /stats."""

from typing import Dict

from pydantic import BaseModel, Field


class DatasetSummary(BaseModel):
    total_reviews: int
    positive_count: int
    negative_count: int
    positive_percentage: float
    negative_percentage: float
    source: str


class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    auc: float
    name: str
    is_default: bool


class ReliabilitySummary(BaseModel):
    high_confidence_percentage: float
    medium_confidence_percentage: float
    low_confidence_percentage: float


class StatsResponse(BaseModel):
    dataset_summary: DatasetSummary
    models: Dict[str, ModelMetrics]
    reliability_summary: ReliabilitySummary
    failure_modes: Dict[str, float]
    total_reviews: int = Field(..., description="Same as dataset_summary.total_reviews")
    avg_confidence: float = Field(..., description="Mean confidence across the test set")
