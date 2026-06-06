from fastapi import APIRouter, HTTPException
from backend.schemas.predict import PredictRequest, PredictResponse

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Endpoint to analyze a single product review.
    """
    return {
        "sentiment": 1,
        "confidence": 0.95,
        "reliability": "HIGH",
        "aspects": [],
        "trust_score": 1.0,
        "flags": [],
        "model_used": request.model
    }
