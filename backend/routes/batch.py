"""POST /batch for CSV review aggregation."""

import io

import pandas as pd
from fastapi import APIRouter, File, Request, UploadFile

from exceptions import FileTooLargeError, MissingColumnError, ValidationError
from ml.preprocessing import clean_review_text
from schemas.batch import BatchResponse

router = APIRouter()

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
MAX_ROWS = 2000
BATCH_MODEL = "lr"
TOP_N = 3


def _get_predictor(request: Request):
    """Get predictor from app.state (standard) or fallback to Vercel getter."""
    if hasattr(request.app.state, "predictor") and request.app.state.predictor is not None:
        return request.app.state.predictor
    from api.index import get_predictor
    return get_predictor()


def _get_trust_analyzer(request: Request):
    if hasattr(request.app.state, "trust_analyzer") and request.app.state.trust_analyzer is not None:
        return request.app.state.trust_analyzer
    from api.index import get_trust_analyzer
    return get_trust_analyzer()


@router.post("/batch", response_model=BatchResponse)
async def batch_predict(
    request: Request, file: UploadFile = File(...)
) -> BatchResponse:
    """Process a batch of reviews uploaded as a CSV file."""
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise FileTooLargeError(
            f"Uploaded file is {len(contents)} bytes; maximum allowed is {MAX_FILE_SIZE_BYTES}."
        )

    try:
        dataframe = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise ValidationError(f"Failed to parse CSV: {exc}") from exc

    if "reviewText" not in dataframe.columns:
        raise MissingColumnError(
            "Required column 'reviewText' is missing from the uploaded CSV."
        )

    total_rows = len(dataframe)
    if total_rows > MAX_ROWS:
        raise ValidationError(f"CSV has {total_rows} rows; maximum allowed is {MAX_ROWS}.")

    predictor = _get_predictor(request)
    trust_analyzer = _get_trust_analyzer(request)

    sentiment_distribution = {"positive": 0, "negative": 0}
    reliability_breakdown = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    processed_reviews: list[dict[str, object]] = []
    confidence_sum = 0.0
    suspicious_count = 0
    processed = 0
    skipped = 0

    for _, row in dataframe.iterrows():
        raw_review = row["reviewText"]
        if not isinstance(raw_review, str) or not raw_review.strip():
            skipped += 1
            continue

        cleaned_review = clean_review_text(raw_review)
        if cleaned_review:
            sentiment_result = predictor.predict_sentiment(
                cleaned_review, model_name=BATCH_MODEL
            )
        else:
            sentiment_result = {
                "sentiment": 0,
                "confidence": 0.5,
                "reliability": "LOW",
                "flags": ["uncertain_prediction", "empty_text"],
            }

        trust_result = trust_analyzer.calculate_trust_score(raw_review)
        confidence = float(sentiment_result["confidence"])
        trust_score = float(trust_result["score"])

        sentiment_label = "positive" if sentiment_result["sentiment"] == 1 else "negative"
        sentiment_distribution[sentiment_label] += 1
        reliability_breakdown[str(sentiment_result["reliability"])] += 1
        confidence_sum += confidence
        processed += 1

        if "suspicious_review" in trust_result["flags"] or trust_score < 0.5:
            suspicious_count += 1

        processed_reviews.append(
            {
                "review": raw_review,
                "sentiment": int(sentiment_result["sentiment"]),
                "confidence": confidence,
            }
        )

    average_confidence = round(confidence_sum / processed, 4) if processed else 0.0

    complaints = [review for review in processed_reviews if review["sentiment"] == 0]
    complaints.sort(key=lambda review: float(review["confidence"]), reverse=True)
    top_complaints = [
        {
            "review": str(review["review"]),
            "confidence": round(float(review["confidence"]), 4),
        }
        for review in complaints[:TOP_N]
    ]

    praised = [review for review in processed_reviews if review["sentiment"] == 1]
    praised.sort(key=lambda review: float(review["confidence"]), reverse=True)
    top_praised = [
        {
            "review": str(review["review"]),
            "confidence": round(float(review["confidence"]), 4),
        }
        for review in praised[:TOP_N]
    ]

    return BatchResponse(
        total=total_rows,
        processed=processed,
        skipped=skipped,
        sentiment_distribution=sentiment_distribution,
        avg_confidence=average_confidence,
        top_complaints=top_complaints,
        top_praised=top_praised,
        suspicious_count=suspicious_count,
        reliability_breakdown=reliability_breakdown,
    )
