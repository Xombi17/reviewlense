"""Keyword-based aspect extraction across 8 categories with sentence-level prediction and lazy singleton access."""

import re
from typing import Any, Dict, List

import nltk

from .preprocessing import clean_review_text

ASPECT_KEYWORDS = {
    "battery": ["battery", "charge", "power", "runtime"],
    "sound": ["sound", "audio", "bass", "treble", "volume"],
    "build": ["build", "quality", "durability", "plastic", "metal"],
    "comfort": ["comfort", "fit", "wear", "ergonomics", "pain"],
    "connectivity": ["bluetooth", "wireless", "pairing", "connect", "signal"],
    "delivery": ["shipping", "delivery", "arrived", "package"],
    "price": ["price", "cost", "value", "expensive", "cheap"],
    "mic": ["mic", "microphone", "call", "voice"],
}


class AspectExtractor:
    def __init__(self, predictor_instance: "Predictor"):
        self.predictor = predictor_instance

    def extract_aspects(self, text: str, model_name: str = "lr") -> List[Dict[str, Any]]:
        if not isinstance(text, str) or not text.strip():
            return []

        try:
            sentences = nltk.sent_tokenize(text)
        except LookupError:
            try:
                nltk.download("punkt_tab", quiet=True)
                sentences = nltk.sent_tokenize(text)
            except LookupError:
                sentences = text.split(".")

        results: List[Dict[str, Any]] = []

        for aspect_name, keywords in ASPECT_KEYWORDS.items():
            for sentence in sentences:
                lower_sentence = sentence.lower()
                keyword_matched = any(
                    re.search(rf"\b{re.escape(keyword)}\b", lower_sentence)
                    for keyword in keywords
                )
                if not keyword_matched:
                    continue

                cleaned_sentence = clean_review_text(sentence)
                if cleaned_sentence == "":
                    continue

                prediction = self.predictor.predict_sentiment(
                    cleaned_sentence, model_name=model_name
                )
                results.append(
                    {
                        "aspect": aspect_name,
                        "sentiment": prediction["sentiment"],
                        "confidence": prediction["confidence"],
                    }
                )
                break

        return results


_DEFAULT_EXTRACTOR = None


def _get_default_extractor() -> "AspectExtractor":
    global _DEFAULT_EXTRACTOR
    if _DEFAULT_EXTRACTOR is None:
        from backend.ml.predictor import _get_default_predictor

        _DEFAULT_EXTRACTOR = AspectExtractor(_get_default_predictor())
    return _DEFAULT_EXTRACTOR


def extract_aspects(text: str, model_name: str = "lr") -> List[Dict[str, Any]]:
    """
    Public API: extract_aspects("battery is great but mic is bad")
    Returns: [{"aspect": str, "sentiment": int, "confidence": float}, ...]
    """
    extractor = _get_default_extractor()
    return extractor.extract_aspects(text, model_name=model_name)
