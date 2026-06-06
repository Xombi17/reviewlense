from pydantic import BaseModel
from typing import Dict, List, Any

class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    is_default: bool

class StatsResponse(BaseModel):
    dataset_summary: Dict[str, Any]
    models: Dict[str, ModelMetrics]
