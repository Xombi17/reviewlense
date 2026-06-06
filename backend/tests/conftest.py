"""Shared pytest fixtures for the ml test suite."""

import os
import sys

import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ml.aspects import AspectExtractor
from backend.ml.loader import ModelLoader
from backend.ml.predictor import Predictor
from backend.ml.trust import TrustAnalyzer

MODELS_DIR = os.path.join(BACKEND_DIR, "models")


@pytest.fixture(scope="session")
def loaded_loader():
    """Session-scoped loader - models are loaded once for the entire test run."""
    loader = ModelLoader(models_dir=MODELS_DIR)
    loader.load_all_models()
    return loader


@pytest.fixture(scope="session")
def loaded_predictor(loaded_loader):
    """Session-scoped predictor wrapping the loaded loader."""
    return Predictor(loaded_loader)


@pytest.fixture(scope="session")
def loaded_extractor(loaded_predictor):
    """Session-scoped aspect extractor wrapping the loaded predictor."""
    return AspectExtractor(loaded_predictor)


@pytest.fixture(scope="session")
def loaded_trust_analyzer():
    """Session-scoped trust analyzer (no models needed)."""
    return TrustAnalyzer()
