"""Shared pytest fixtures for the backend test suite."""

import json
import os
import sys

import httpx
import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ml.aspects import AspectExtractor
from backend.ml.loader import ModelLoader
from backend.ml.predictor import Predictor
from backend.ml.trust import TrustAnalyzer
from backend.main import app

MODELS_DIR = os.path.join(BACKEND_DIR, "models")
STATS_PATH = os.path.join(BACKEND_DIR, "data", "stats.json")


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


@pytest.fixture(scope="session")
def api_test_app(loaded_loader, loaded_predictor, loaded_extractor, loaded_trust_analyzer):
    """App instance with state initialized for ASGI transport tests."""
    with open(STATS_PATH, "r", encoding="utf-8") as file:
        stats = json.load(file)

    app.state.loader = loaded_loader
    app.state.predictor = loaded_predictor
    app.state.extractor = loaded_extractor
    app.state.trust_analyzer = loaded_trust_analyzer
    app.state.stats = stats
    return app


@pytest.fixture()
async def api_client(api_test_app):
    """Async HTTP client bound directly to the ASGI app."""
    transport = httpx.ASGITransport(app=api_test_app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as client:
        yield client
