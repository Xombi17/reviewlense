from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.routes import predict, batch, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all models at startup here
    yield
    # Clean up models if necessary

app = FastAPI(
    title="ReviewLens AI API",
    description="Sentiment Analysis and Review Insights API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
