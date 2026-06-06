import pytest

from backend.ml.trust import TrustAnalyzer, compute_trust_score

pytestmark = pytest.mark.filterwarnings("ignore::DeprecationWarning")


def test_trust_score_great_exclamations():
    result = compute_trust_score("GREAT!!!!")

    assert result["score"] == 0.4
    assert "very_short_review" in result["flags"]
    assert "suspicious_review" in result["flags"]


def test_trust_score_length_penalty_only():
    result = compute_trust_score("short review")

    assert result["score"] == 0.7
    assert result["flags"] == ["very_short_review"]


def test_trust_score_all_caps_penalty():
    result = compute_trust_score("THIS IS AN UPPERCASE REVIEW")

    assert result["score"] == 0.8


def test_trust_score_exclamation_penalty():
    result = compute_trust_score("This review has enough length!!!!")

    assert result["score"] == 0.9


def test_trust_score_repeating_words_penalty():
    result = compute_trust_score("echo echo echo echo with enough surrounding words")

    assert result["score"] == 0.85


def test_trust_score_floor_and_suspicious_flag():
    text = "BAD BAD BAD BAD!!!!"
    result = TrustAnalyzer().calculate_trust_score(text)

    assert result["score"] == 0.25
    assert "suspicious_review" in result["flags"]


def test_trust_score_non_string_input():
    result = compute_trust_score(None)

    assert result == {"score": 0.0, "flags": ["suspicious_review"]}
