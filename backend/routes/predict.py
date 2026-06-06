"""POST /predict with sentiment, aspect, and trust analysis."""

from fastapi import APIRouter, Request

from exceptions import EmptyReviewError, ModelNotFoundError
from ml.preprocessing import clean_review_text
from schemas.predict import AspectSentiment, PredictRequest, PredictResponse

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
async def predict(request: Request, body: PredictRequest) -> PredictResponse:
    """Analyze a single product review."""
    if not body.review or not body.review.strip():
        raise EmptyReviewError("Review text is empty or whitespace-only.")

    available_models = list(request.app.state.loader.models.keys())
    if body.model not in available_models:
        raise ModelNotFoundError(
            f"Model '{body.model}' is not loaded. Available: {available_models}"
        )

    cleaned_review = clean_review_text(body.review)
    if cleaned_review:
        sentiment_result = request.app.state.predictor.predict_sentiment(
            cleaned_review, model_name=body.model
        )
    else:
        sentiment_result = {
            "sentiment": 0,
            "confidence": 0.5,
            "reliability": "LOW",
            "flags": ["uncertain_prediction", "empty_text"],
        }

    aspects_raw = request.app.state.extractor.extract_aspects(
        body.review, model_name=body.model
    )
    aspects = [
        AspectSentiment(
            aspect=aspect["aspect"],
            sentiment=aspect["sentiment"],
            confidence=aspect["confidence"],
        )
        for aspect in aspects_raw
    ]

    trust_result = request.app.state.trust_analyzer.calculate_trust_score(body.review)
    merged_flags = list(sentiment_result["flags"]) + list(trust_result["flags"])

    seen_flags: set[str] = set()
    deduplicated_flags: list[str] = []
    for flag in merged_flags:
        if flag in seen_flags:
            continue
        seen_flags.add(flag)
        deduplicated_flags.append(flag)

    return PredictResponse(
        sentiment=int(sentiment_result["sentiment"]),
        confidence=float(sentiment_result["confidence"]),
        reliability=str(sentiment_result["reliability"]),
        aspects=aspects,
        trust_score=float(trust_result["score"]),
        flags=deduplicated_flags,
        model_used=body.model,
    )
