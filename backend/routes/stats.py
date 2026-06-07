from fastapi import APIRouter, Request

from schemas.stats import StatsResponse

router = APIRouter()


def _get_stats(request: Request):
    """Get stats from app.state (standard) or fallback to Vercel getter."""
    if hasattr(request.app.state, "stats") and request.app.state.stats is not None:
        return request.app.state.stats
    from api.index import get_stats
    return get_stats()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(request: Request) -> StatsResponse:
    """Retrieve cached dataset and model evaluation statistics."""
    cached_stats = _get_stats(request)
    if cached_stats is None:
        raise RuntimeError("Stats not available; models may not have loaded yet")
    return StatsResponse.model_validate(cached_stats)
