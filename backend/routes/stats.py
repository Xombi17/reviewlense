from fastapi import APIRouter, Request

from schemas.stats import StatsResponse

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(request: Request) -> StatsResponse:
    """Retrieve cached dataset and model evaluation statistics."""
    cached_stats = getattr(request.app.state, "stats", None)
    if cached_stats is None:
        raise RuntimeError("app.state.stats is not populated; lifespan did not run")
    return StatsResponse.model_validate(cached_stats)
