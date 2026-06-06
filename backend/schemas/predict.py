from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class PredictRequest(BaseModel):
    review: str = Field(..., min_length=3, max_length=5000)
    model: Optional[str] = Field("lr", pattern="^(lr|nb|svm)$")

class AspectSentiment(BaseModel):
    aspect: str
    sentiment: int
    confidence: float

class PredictResponse(BaseModel):
    sentiment: int
    confidence: float
    reliability: str
    aspects: List[AspectSentiment]
    trust_score: float
    flags: List[str]
    model_used: str
