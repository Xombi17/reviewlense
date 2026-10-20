from typing import List, Optional

from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    name: str
    is_default: bool
    calibrated: bool
    temperature: Optional[float] = None
    base_model: Optional[str] = None


class ModelsResponse(BaseModel):
    models: List[ModelInfo]
