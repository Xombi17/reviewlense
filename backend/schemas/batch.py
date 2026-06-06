from pydantic import BaseModel
from typing import Dict, List

class BatchResponse(BaseModel):
    total: int
    processed: int
    skipped: int
    sentiment_distribution: Dict[str, int]
    avg_confidence: float
    top_complaints: List[Dict[str, str]]
    top_praised: List[Dict[str, str]]
    suspicious_count: int
    reliability_breakdown: Dict[str, int]
