from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

class PredictRequest(BaseModel):
    review: str = Field(..., max_length=5000)
    model: Optional[str] = Field("lr")

class AspectSentiment(BaseModel):
    aspect: str
    sentiment: int
    confidence: float

class PredictResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    sentiment: int
    confidence: float
    reliability: str
    aspects: List[AspectSentiment]
    trust_score: float
    flags: List[str]
    model_used: str
