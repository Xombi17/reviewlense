from contextlib import asynccontextmanager
import json
import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from exceptions import (
    APIError,
    api_error_handler,
    request_validation_error_handler,
    unhandled_exception_handler,
)
from ml.aspects import AspectExtractor
from ml.loader import ModelLoader
from ml.predictor import Predictor
from ml.trust import TrustAnalyzer
from routes import predict, batch, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(backend_dir, "models")
    data_dir = os.path.join(backend_dir, "data")
    stats_path = os.path.join(data_dir, "stats.json")

    loader = ModelLoader(models_dir=models_dir)
    loader.load_all_models()
    app.state.loader = loader

    predictor = Predictor(loader)
    app.state.predictor = predictor

    extractor = AspectExtractor(predictor)
    app.state.extractor = extractor

    app.state.trust_analyzer = TrustAnalyzer()

    with open(stats_path, "r", encoding="utf-8") as file:
        app.state.stats = json.load(file)

    yield

    app.state.loader = None
    app.state.predictor = None
    app.state.extractor = None
    app.state.trust_analyzer = None
    app.state.stats = None

app = FastAPI(
    title="ReviewLens AI API",
    description="Sentiment Analysis and Review Insights API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_exception_handler(APIError, api_error_handler)
app.add_exception_handler(RequestValidationError, request_validation_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Enable CORS for Next.js frontend
allow_origins = os.getenv("ALLOW_ORIGINS", "http://localhost:3000").split(",")
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

@app.get("/")
async def root():
    return {"message": "Welcome to the ReviewLens AI API!"}
