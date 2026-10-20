import os

import joblib
import pytest

from backend.ml.loader import ModelLoader

pytestmark = pytest.mark.filterwarnings("ignore::DeprecationWarning")

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")


def test_loader_loads_all_models():
    loader = ModelLoader(models_dir=MODELS_DIR)
    loader.load_all_models()

    assert set(loader.models.keys()) == {"lr", "nb"}
    assert loader.vectorizer is not None
    assert loader.get_model("lr") is loader.models["lr"]


def test_loader_get_model_returns_none_for_unknown():
    loader = ModelLoader(models_dir=MODELS_DIR)
    loader.load_all_models()

    assert loader.get_model("nonexistent") is None


def test_loader_missing_dir_raises(tmp_path):
    missing_dir = tmp_path / "nonexistent"

    with pytest.raises(FileNotFoundError) as exc_info:
        ModelLoader(models_dir=str(missing_dir)).load_all_models()

    assert "Models directory not found" in str(exc_info.value)


def test_loader_missing_vectorizer_raises(tmp_path):
    joblib.dump({"x": 1}, tmp_path / "sentiment_lr.pkl")

    with pytest.raises(FileNotFoundError) as exc_info:
        ModelLoader(models_dir=str(tmp_path)).load_all_models()

    assert "Vectorizer not found" in str(exc_info.value)


def test_loader_no_sentiment_models_raises(tmp_path):
    joblib.dump("fake_vec", tmp_path / "vectorizer.pkl")

    with pytest.raises(RuntimeError) as exc_info:
        ModelLoader(models_dir=str(tmp_path)).load_all_models()

    assert "No sentiment models" in str(exc_info.value)
