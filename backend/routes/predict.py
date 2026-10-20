"""POST /predict with sentiment, aspect, and trust analysis."""

from fastapi import APIRouter, Request
from fastapi.concurrency import run_in_threadpool

from exceptions import EmptyReviewError, ModelNotFoundError
from schemas.predict import AspectSentiment, PredictRequest, PredictResponse

router = APIRouter()


def _get_loader(request: Request):
    """Get loader from app.state (standard) or fallback to Vercel getter."""
    if hasattr(request.app.state, "loader") and request.app.state.loader is not None:
        return request.app.state.loader
    # Vercel serverless fallback
    from api.index import get_loader
    return get_loader()


def _get_predictor(request: Request):
    if hasattr(request.app.state, "predictor") and request.app.state.predictor is not None:
        return request.app.state.predictor
    from api.index import get_predictor
    return get_predictor()


def _get_extractor(request: Request):
    if hasattr(request.app.state, "extractor") and request.app.state.extractor is not None:
        return request.app.state.extractor
    from api.index import get_extractor
    return get_extractor()


def _get_trust_analyzer(request: Request):
    if hasattr(request.app.state, "trust_analyzer") and request.app.state.trust_analyzer is not None:
        return request.app.state.trust_analyzer
    from api.index import get_trust_analyzer
    return get_trust_analyzer()


@router.post("/predict", response_model=PredictResponse)
async def predict(request: Request, body: PredictRequest) -> PredictResponse:
    """Analyze a single product review."""
    if not body.review or not body.review.strip():
        raise EmptyReviewError("Review text is empty or whitespace-only.")

    loader = _get_loader(request)
    available_models = loader.available_models()
    if body.model not in available_models:
        raise ModelNotFoundError(
            f"Model '{body.model}' is not loaded. Available: {available_models}"
        )

    predictor = _get_predictor(request)
    # Model inference is CPU-bound (slow for the transformer); keep it off the event loop.
    sentiment_result = await run_in_threadpool(predictor.predict_review, body.review, body.model)

    extractor = _get_extractor(request)
    aspects_raw = await run_in_threadpool(extractor.extract_aspects, body.review, body.model)
    aspects = [
        AspectSentiment(
            aspect=aspect["aspect"],
            sentiment=aspect["sentiment"],
            confidence=aspect["confidence"],
        )
        for aspect in aspects_raw
    ]

    trust_analyzer = _get_trust_analyzer(request)
    trust_result = trust_analyzer.calculate_trust_score(body.review)
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
