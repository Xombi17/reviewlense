# Cloud Run image for the ReviewLens API (TF-IDF models + optional transformer).
# Build with the backend/ folder as the context:
#   docker build -f deploy/cloudrun/Dockerfile backend
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app \
    NLTK_DATA=/usr/local/share/nltk_data

WORKDIR /app

# CPU-only torch first so requirements-transformer.txt does not pull the CUDA build.
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu
COPY requirements-local.txt requirements-transformer.txt ./
RUN pip install -r requirements-local.txt -r requirements-transformer.txt

RUN python -c "import nltk; [nltk.download(p, download_dir='$NLTK_DATA', quiet=True) for p in ('punkt_tab', 'punkt', 'stopwords', 'wordnet')]" \
    && chmod -R a+rX $NLTK_DATA

COPY . .

RUN useradd -r -d /app -s /sbin/nologin appuser
USER appuser

# One worker: each worker would load its own copy of torch and the model.
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]
