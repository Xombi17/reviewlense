"""GET /models: which models this deployment can serve."""

from fastapi import APIRouter, Request

from schemas.models import ModelInfo, ModelsResponse

router = APIRouter()

TFIDF_NAMES = {
    "lr": "Logistic Regression (TF-IDF)",
    "nb": "Multinomial Naive Bayes (TF-IDF)",
}


def _get_loader(request: Request):
    if hasattr(request.app.state, "loader") and request.app.state.loader is not None:
        return request.app.state.loader
    from api.index import get_loader
    return get_loader()


@router.get("/models", response_model=ModelsResponse)
async def list_models(request: Request) -> ModelsResponse:
    """List the loaded models. The TF-IDF models report raw probabilities; the transformer's are
    calibrated with a temperature fitted on validation data."""
    loader = _get_loader(request)
    models = []
    for name in loader.available_models():
        if name == "transformer":
            details = loader.transformer.describe()
            base_model = details.get("base_model")
            models.append(
                ModelInfo(
                    id="transformer",
                    name="DistilRoBERTa (fine-tuned)"
                    if "distilroberta" in str(base_model).lower()
                    else "Fine-tuned transformer",
                    is_default=False,
                    calibrated=True,
                    temperature=details["temperature"],
                    base_model=base_model,
                )
            )
        else:
            models.append(
                ModelInfo(id=name, name=TFIDF_NAMES.get(name, name), is_default=name == "lr", calibrated=False)
            )
    return ModelsResponse(models=models)
