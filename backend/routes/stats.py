from fastapi import APIRouter, HTTPException
from backend.schemas.stats import StatsResponse

router = APIRouter()

@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """
    Endpoint to retrieve evaluation statistics for all trained models.
    """
    return {
        "dataset_summary": {
            "total_reviews": 0,
            "positive_reviews": 0,
            "negative_reviews": 0
        },
        "models": {
            "lr": {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "is_default": True
            },
            "nb": {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "is_default": False
            },
            "svm": {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "is_default": False
            }
        }
    }
