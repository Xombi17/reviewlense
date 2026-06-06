from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.schemas.batch import BatchResponse

router = APIRouter()

@router.post("/batch", response_model=BatchResponse)
async def batch_predict(file: UploadFile = File(...)):
    """
    Endpoint to process a batch of reviews via CSV.
    """
    return {
        "total": 0,
        "processed": 0,
        "skipped": 0,
        "sentiment_distribution": {"positive": 0, "negative": 0},
        "avg_confidence": 0.0,
        "top_complaints": [],
        "top_praised": [],
        "suspicious_count": 0,
        "reliability_breakdown": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    }
