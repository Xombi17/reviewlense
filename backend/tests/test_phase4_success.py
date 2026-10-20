"""End-to-end smoke tests for the 4 ROADMAP.md Phase 4 success criteria."""

import pytest

from backend.ml import compute_trust_score, extract_aspects, predict


def test_phase4_success_criterion_1_predict_shape(loaded_predictor):
    result = predict("battery life is amazing", "lr")

    assert isinstance(result, dict)
    assert set(result.keys()) == {"sentiment", "confidence", "reliability", "flags"}
    assert result["sentiment"] in (0, 1)
    assert isinstance(result["confidence"], float)
    assert result["reliability"] in ("HIGH", "MEDIUM", "LOW")
    assert isinstance(result["flags"], list)


def test_phase4_success_criterion_2_aspects_count(loaded_extractor):
    result = extract_aspects("battery is great but mic is bad")

    assert isinstance(result, list)
    assert len(result) == 2
    assert {aspect["aspect"] for aspect in result} == {"battery", "mic"}
    assert all(set(aspect.keys()) == {"aspect", "sentiment", "confidence"} for aspect in result)


def test_phase4_success_criterion_3_trust_low_score(loaded_trust_analyzer):
    result = compute_trust_score("GREAT!!!!")

    assert isinstance(result, dict)
    assert isinstance(result["score"], float)
    assert result["score"] < 0.8
    assert result["score"] == pytest.approx(0.4, abs=0.01)


def test_phase4_success_criterion_4_confidence_range(loaded_predictor):
    for model_name in ["lr", "nb"]:
        result = predict("battery life is amazing", model_name)
        assert isinstance(result["confidence"], float)
        assert 0.5 <= result["confidence"] <= 1.0
