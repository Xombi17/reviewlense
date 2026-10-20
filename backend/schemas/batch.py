from typing import Dict, List

from pydantic import BaseModel


class BatchReviewItem(BaseModel):
    review: str
    confidence: float

class BatchResponse(BaseModel):
    total: int
    processed: int
    skipped: int
    sentiment_distribution: Dict[str, int]
    avg_confidence: float
    top_complaints: List[BatchReviewItem]
    top_praised: List[BatchReviewItem]
    suspicious_count: int
    reliability_breakdown: Dict[str, int]
    model_used: str = "lr"
