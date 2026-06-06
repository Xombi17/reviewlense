import os

import pytest

from backend.ml.aspects import AspectExtractor, extract_aspects
from backend.ml.loader import ModelLoader
from backend.ml.predictor import Predictor

pytestmark = pytest.mark.filterwarnings("ignore::DeprecationWarning")

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
loader = ModelLoader(models_dir=MODELS_DIR)
loader.load_all_models()
predictor = Predictor(loader)
extractor = AspectExtractor(predictor)


def test_aspects_two_mentions():
    result = extractor.extract_aspects("battery is great but mic is bad", "lr")

    assert len(result) == 2
    assert {aspect["aspect"] for aspect in result} == {"battery", "mic"}
    assert all(set(aspect.keys()) == {"aspect", "sentiment", "confidence"} for aspect in result)


def test_aspects_output_shape():
    result = extractor.extract_aspects("battery life is amazing", "lr")

    assert len(result) == 1
    assert set(result[0].keys()) == {"aspect", "sentiment", "confidence"}
    assert result[0]["aspect"] == "battery"
    assert isinstance(result[0]["sentiment"], int)
    assert result[0]["sentiment"] in (0, 1)
    assert isinstance(result[0]["confidence"], float)
    assert 0.5 <= result[0]["confidence"] <= 1.0


def test_aspects_no_keywords_empty():
    assert extractor.extract_aspects("this product is wonderful", "lr") == []


def test_aspects_dedup():
    result = extractor.extract_aspects(
        "the battery is great. I love the battery life. Battery lasts long.", "lr"
    )

    assert len(result) == 1


def test_aspects_all_eight_categories():
    result = extractor.extract_aspects(
        "battery sound build comfort bluetooth delivery price mic are all mentioned", "lr"
    )

    assert len(result) == 8
    assert {aspect["aspect"] for aspect in result} == {
        "battery",
        "sound",
        "build",
        "comfort",
        "connectivity",
        "delivery",
        "price",
        "mic",
    }


def test_aspects_module_level_function():
    result = extract_aspects("battery is great but mic is bad")

    assert len(result) == 2
    assert {aspect["aspect"] for aspect in result} == {"battery", "mic"}
