"""Sentiment prediction with confidence = max(predict_proba), HIGH/MEDIUM/LOW reliability tiers, uncertain_prediction flag, and lazy model loading."""

import os
from typing import Any, Dict, List

from .preprocessing import clean_review_text


class Predictor:
    def __init__(self, loader_instance):
        self.loader = loader_instance

    def predict_sentiment(self, cleaned_text: str, model_name: str = "lr") -> Dict[str, Any]:
        if model_name not in self.loader.models:
            raise ValueError(
                f"Unknown model: {model_name}. Available: {list(self.loader.models.keys())}"
            )
        if self.loader.vectorizer is None:
            raise RuntimeError("Vectorizer not loaded")

        vectorized_text = self.loader.vectorizer.transform([cleaned_text])
        model = self.loader.models[model_name]
        probabilities = model.predict_proba(vectorized_text)[0]
        prediction = int(model.predict(vectorized_text)[0])
        confidence = float(max(probabilities))

        if confidence >= 0.90:
            reliability = "HIGH"
        elif confidence >= 0.70:
            reliability = "MEDIUM"
        else:
            reliability = "LOW"

        flags: List[str] = []
        if confidence < 0.70:
            flags.append("uncertain_prediction")

        return {
            "sentiment": prediction,
            "confidence": round(confidence, 4),
            "reliability": reliability,
            "flags": flags,
        }


_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODELS_DIR = os.path.join(_BACKEND_DIR, "models")

_DEFAULT_LOADER = None
_DEFAULT_PREDICTOR = None


def _get_default_predictor() -> "Predictor":
    global _DEFAULT_LOADER, _DEFAULT_PREDICTOR
    if _DEFAULT_PREDICTOR is None:
        from .loader import ModelLoader

        _DEFAULT_LOADER = ModelLoader(models_dir=_MODELS_DIR)
        _DEFAULT_LOADER.load_all_models()
        _DEFAULT_PREDICTOR = Predictor(_DEFAULT_LOADER)
    return _DEFAULT_PREDICTOR


def predict(text: str, model_name: str = "lr") -> Dict[str, Any]:
    """
    Public API: predict("battery life is amazing", "lr")
    Returns: {"sentiment": int, "confidence": float, "reliability": str, "flags": List[str]}
    """
    cleaned_text = clean_review_text(text)
    if cleaned_text == "":
        return {
            "sentiment": 0,
            "confidence": 0.5,
            "reliability": "LOW",
            "flags": ["uncertain_prediction", "empty_text"],
        }

    predictor = _get_default_predictor()
    return predictor.predict_sentiment(cleaned_text, model_name=model_name)
