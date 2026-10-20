# ReviewLens AI - API Reference

The ReviewLens AI backend is powered by FastAPI and exposes endpoints for single predictions, bulk batch uploads, the available models, and dataset statistics.

---

## 1. Single Review Analysis
Analyze a single string of text for overall sentiment, specific aspects, and review credibility.

* **Endpoint**: `POST /predict`
* **Content-Type**: `application/json`
* **Request Schema**:
  - `review` (string, required, max length: 5000): The review text to analyze.
  - `model` (string, optional, default: `"lr"`): The classifier to use: `"lr"`, `"nb"`, or `"transformer"` when the fine-tuned model is configured (see [Serving the transformer](#serving-the-transformer)). Call `GET /models` to see what a deployment offers.

The TF-IDF models (`lr`, `nb`) clean the text before classifying it. The transformer reads the review exactly as written, and its `confidence` is calibrated: it is the probability after a temperature fitted on validation data, so `reliability` tiers (HIGH >= 0.90, MEDIUM >= 0.70, LOW) correspond to the accuracy they claim far more closely than the raw TF-IDF confidences do.

### Example Request
```json
{
  "review": "The battery life is amazing, but the microphone is kinda quiet.",
  "model": "lr"
}
```

### Example Response (`200 OK`)
```json
{
  "sentiment": 1,
  "confidence": 0.9412,
  "reliability": "HIGH",
  "aspects": [
    {
      "aspect": "battery",
      "sentiment": 1,
      "confidence": 0.9412
    },
    {
      "aspect": "mic",
      "sentiment": 0,
      "confidence": 0.7681
    }
  ],
  "trust_score": 1.0,
  "flags": [],
  "model_used": "lr"
}
```

---

## 2. Bulk Batch CSV Processing
Process a CSV file containing reviews and return aggregated metrics, distributions, and top features.

* **Endpoint**: `POST /batch`
* **Content-Type**: `multipart/form-data`
* **Request Body**:
  - `file`: A CSV file containing a column named exactly `reviewText`.
  - `model` (query parameter, optional, default: `"lr"`): `"lr"`, `"nb"` or `"transformer"`. The transformer is much slower per review, so uploads are capped at `TRANSFORMER_MAX_BATCH_ROWS` rows (default 500); larger files get a `422`. The response includes `model_used`.
* **Constraints**:
  - Max file size: `5 MB`.
  - Max row limit: `2000` rows.
  - Default model used: `"lr"`.

### Example Response (`200 OK`)
```json
{
  "total": 150,
  "processed": 148,
  "skipped": 2,
  "sentiment_distribution": {
    "positive": 120,
    "negative": 28
  },
  "avg_confidence": 0.9124,
  "top_complaints": [
    {
      "review": "The sound cuts out completely. Horrible connection.",
      "confidence": 0.9981
    }
  ],
  "top_praised": [
    {
      "review": "Super comfortable and fit perfectly in my ears.",
      "confidence": 0.9995
    }
  ],
  "suspicious_count": 8,
  "reliability_breakdown": {
    "HIGH": 110,
    "MEDIUM": 25,
    "LOW": 13
  },
  "model_used": "lr"
}
```

---

## 3. Available Models
List the models this deployment can serve.

* **Endpoint**: `GET /models`

### Example Response (`200 OK`)
```json
{
  "models": [
    {"id": "lr", "name": "Logistic Regression (TF-IDF)", "is_default": true, "calibrated": false, "temperature": null, "base_model": null},
    {"id": "nb", "name": "Multinomial Naive Bayes (TF-IDF)", "is_default": false, "calibrated": false, "temperature": null, "base_model": null},
    {"id": "transformer", "name": "DistilRoBERTa (fine-tuned)", "is_default": false, "calibrated": true, "temperature": 1.481, "base_model": "distilroberta-base"}
  ]
}
```
`transformer` appears only when `TRANSFORMER_MODEL` is set.

## 4. Dataset & Model Statistics
Retrieve cached dataset metadata and evaluation metrics for all trained models.

* **Endpoint**: `GET /stats`

### Example Response (`200 OK`)
```json
{
  "total_reviews": 1398553,
  "avg_confidence": 0.907566249370575,
  "dataset_summary": {
    "total_reviews": 1000000,
    "positive_count": 500000,
    "negative_count": 500000,
    "positive_percentage": 50.0,
    "negative_percentage": 50.0,
    "source": "Amazon Review Polarity Dataset (Local) - 1M balanced subset"
  },
  "models": {
    "lr": {
      "accuracy": 0.9208712517532173,
      "precision": 0.9202304487131274,
      "recall": 0.9215288517544036,
      "f1": 0.9208791925598292,
      "auc": 0.9751527201320513,
      "name": "Logistic Regression",
      "is_default": true
    },
    "nb": {
      "accuracy": 0.8784352394788146,
      "precision": 0.8904826556945495,
      "recall": 0.8628411898210449,
      "f1": 0.8764440364164945,
      "auc": 0.9503431478990761,
      "name": "Multinomial Naive Bayes",
      "is_default": false
    }
  },
  "reliability_summary": {
    "high_confidence_percentage": 70.6189641026413,
    "medium_confidence_percentage": 18.90263026498358,
    "low_confidence_percentage": 10.478405632375116
  },
  "failure_modes": {
    "mixed_sentiment": 7.0,
    "sarcasm": 0.0,
    "comparative": 0.0,
    "short_review": 0.0,
    "negation_failure": 8.0
  }
}
```

---

## Serving the transformer

The transformer is optional and off by default. To enable it, install `requirements-transformer.txt` and point the API at the folder written by `python -m experiments.run_experiment --save-model DIR` (or at a Hugging Face hub id that contains the same files):

| Environment variable | Meaning |
| :-- | :-- |
| `TRANSFORMER_MODEL` | Local directory or hub id. Unset means TF-IDF only. A value that cannot be loaded stops startup with an error instead of silently serving TF-IDF only. |
| `TRANSFORMER_DEVICE` | `cpu` or `cuda`. Defaults to `cuda` when available, else `cpu`. |
| `TRANSFORMER_BATCH_SIZE` | Reviews scored per forward pass (default 32). |
| `TRANSFORMER_MAX_BATCH_ROWS` | Row cap for `/batch` with the transformer (default 500). |

The model folder must contain `calibration.json` next to the weights. It holds the temperature fitted on validation data; loading refuses a folder without it, because an uncalibrated confidence would make the reliability tiers meaningless.

---

## ❌ Error Codes & Response Format

All error endpoints return a standardized payload:
```json
{
  "detail": "Detailed explanation of the error."
}
```

* **`400 Bad Request`**:
  - `EmptyReviewError`: Raised if the review parameter is empty or contains only whitespace.
  - `FileTooLargeError`: Raised if the uploaded CSV exceeds `5 MB`.
  - `MissingColumnError`: Raised if the CSV is missing the `reviewText` header.
  - `ValidationError`: Raised for malformed CSV parsed inputs or row limits exceeded (> 2000 rows).
  - `ModelNotFoundError`: Raised if the specified `model` parameter is not one of `lr` or `nb`.
* **`500 Internal Server Error`**:
  - Raised for unexpected application errors or model parsing failures.
