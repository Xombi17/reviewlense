"""ReviewLens AI — ML layer public API.

Exposes:
- ModelLoader: loads .pkl artifacts (vectorizer + 3 sentiment classifiers).
- Predictor + predict(): sentiment prediction with confidence/reliability/flags.
- AspectExtractor + extract_aspects(): per-aspect sentiment extraction.
- TrustAnalyzer + compute_trust_score(): heuristic review quality score.

All module-level functions use a lazy singleton pattern - .pkl files are
loaded on first call only.
"""

from backend.ml.loader import ModelLoader
from backend.ml.predictor import Predictor, predict
from backend.ml.aspects import AspectExtractor, extract_aspects
from backend.ml.trust import TrustAnalyzer, compute_trust_score

__all__ = [
    "ModelLoader",
    "Predictor",
    "predict",
    "AspectExtractor",
    "extract_aspects",
    "TrustAnalyzer",
    "compute_trust_score",
]
