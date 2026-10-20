import os

import pytest

from backend.ml.loader import ModelLoader
from backend.ml.predictor import Predictor, predict
from backend.ml.preprocessing import clean_review_text

pytestmark = pytest.mark.filterwarnings("ignore::DeprecationWarning")

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
loader = ModelLoader(models_dir=MODELS_DIR)
loader.load_all_models()
predictor = Predictor(loader)


def test_predictor_returns_correct_shape():
    result = predictor.predict_sentiment(clean_review_text("battery life is amazing"), "lr")

    assert set(result.keys()) == {"sentiment", "confidence", "reliability", "flags"}
    assert isinstance(result["sentiment"], int)
    assert result["sentiment"] in (0, 1)
    assert isinstance(result["confidence"], float)
    assert result["reliability"] in ("HIGH", "MEDIUM", "LOW")
    assert isinstance(result["flags"], list)


def test_predictor_confidence_range():
    for model_name in ["lr", "nb"]:
        result = predictor.predict_sentiment(
            clean_review_text("this product is wonderful and I love it"), model_name
        )
        assert 0.5 <= result["confidence"] <= 1.0


def test_predictor_reliability_tiers(monkeypatch):
    model = loader.models["lr"]

    monkeypatch.setattr(model, "predict", lambda _vec: [1])
    monkeypatch.setattr(model, "predict_proba", lambda _vec: [[0.05, 0.95]])
    assert predictor.predict_sentiment("battery life amazing", "lr")["reliability"] == "HIGH"

    monkeypatch.setattr(model, "predict_proba", lambda _vec: [[0.20, 0.80]])
    assert predictor.predict_sentiment("battery life amazing", "lr")["reliability"] == "MEDIUM"

    monkeypatch.setattr(model, "predict_proba", lambda _vec: [[0.40, 0.60]])
    assert predictor.predict_sentiment("battery life amazing", "lr")["reliability"] == "LOW"


def test_predictor_uncertain_flag(monkeypatch):
    model = loader.models["lr"]

    monkeypatch.setattr(model, "predict", lambda _vec: [1])
    monkeypatch.setattr(model, "predict_proba", lambda _vec: [[0.40, 0.60]])
    low_confidence_result = predictor.predict_sentiment("battery life amazing", "lr")
    assert "uncertain_prediction" in low_confidence_result["flags"]

    monkeypatch.setattr(model, "predict_proba", lambda _vec: [[0.10, 0.90]])
    high_confidence_result = predictor.predict_sentiment("battery life amazing", "lr")
    assert "uncertain_prediction" not in high_confidence_result["flags"]


def test_predictor_module_level_function():
    result = predict("battery life is amazing", "lr")

    assert set(result.keys()) == {"sentiment", "confidence", "reliability", "flags"}


def test_predictor_works_for_all_three_models():
    for model_name in ["lr", "nb"]:
        result = predictor.predict_sentiment(clean_review_text("this is great"), model_name)
        assert set(result.keys()) == {"sentiment", "confidence", "reliability", "flags"}
        assert 0.5 <= result["confidence"] <= 1.0


def test_predictor_unknown_model_raises():
    with pytest.raises(ValueError) as exc_info:
        predictor.predict_sentiment("test", "nonexistent")

    assert "Unknown model" in str(exc_info.value)


def test_predictor_empty_text_handled():
    result = predict("")

    assert result["confidence"] == 0.5
    assert result["reliability"] == "LOW"
    assert "empty_text" in result["flags"]
