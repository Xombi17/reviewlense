#!/usr/bin/env python3
"""
Vercel Serverless Function Entry Point for ReviewLens AI Backend.

This file wraps the FastAPI app for deployment as a Vercel Python serverless function.
Key adaptations for serverless:
- Models loaded lazily on first request and cached globally (stateless functions)
- NLTK data downloaded at cold start if missing
- No lifespan context manager (not supported in serverless)
"""

import os
import json
import nltk
from typing import Any, Dict

# Ensure NLTK data is available (download at cold start if needed)
try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab", quiet=True)

# Global singletons for model caching across invocations
_loader = None
_predictor = None
_extractor = None
_trust_analyzer = None
_stats = None


def _initialize_models():
    """Load ML models and components on first request (lazy initialization)."""
    global _loader, _predictor, _extractor, _trust_analyzer, _stats

    if _loader is not None:
        return  # Already initialized

    from ml.loader import ModelLoader
    from ml.predictor import Predictor
    from ml.aspects import AspectExtractor
    from ml.trust import TrustAnalyzer

    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(backend_dir, "models")
    data_dir = os.path.join(backend_dir, "data")
    stats_path = os.path.join(data_dir, "stats.json")

    _loader = ModelLoader(models_dir=models_dir)
    _loader.load_all_models()

    _predictor = Predictor(_loader)
    _extractor = AspectExtractor(_predictor)
    _trust_analyzer = TrustAnalyzer()

    with open(stats_path, "r", encoding="utf-8") as f:
        _stats = json.load(f)


# Import and create the FastAPI app after defining initialization
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from exceptions import (
    APIError,
    api_error_handler,
    request_validation_error_handler,
    unhandled_exception_handler,
)
from routes import predict, batch, stats

# Create the FastAPI app (without lifespan)
app = FastAPI(
    title="ReviewLens AI API",
    description="Sentiment Analysis and Review Insights API",
    version="1.0.0",
)

# Exception handlers
app.add_exception_handler(APIError, api_error_handler)
app.add_exception_handler(RequestValidationError, request_validation_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# CORS for Vercel frontend - allow all origins in production, specific in dev
allow_origins = os.getenv("ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(predict.router, tags=["sentiment"])
app.include_router(batch.router, tags=["batch"])
app.include_router(stats.router, tags=["stats"])


# Dependency injection for routes - override the app.state access
def get_loader():
    _initialize_models()
    return _loader


def get_predictor():
    _initialize_models()
    return _predictor


def get_extractor():
    _initialize_models()
    return _extractor


def get_trust_analyzer():
    _initialize_models()
    return _trust_analyzer


def get_stats():
    _initialize_models()
    return _stats


# Vercel serverless function handler
def handler(request):
    """Vercel Python serverless function handler."""
    from mangum import Mangum

    return Mangum(app)(request, {})


@app.get("/")
async def root():
    return {"message": "Welcome to the ReviewLens AI API!"}


@app.get("/health")
async def health():
    """Health check endpoint for Vercel."""
    return {"status": "healthy", "service": "reviewlens-ai-api"}


# For local testing with `vercel dev`
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)