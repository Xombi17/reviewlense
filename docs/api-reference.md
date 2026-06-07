# ReviewLens AI - API Reference

The ReviewLens AI backend is powered by FastAPI and exposes three core endpoints for single predictions, bulk batch uploads, and dataset statistics.

---

## 1. Single Review Analysis
Analyze a single string of text for overall sentiment, specific aspects, and review credibility.

* **Endpoint**: `POST /predict`
* **Content-Type**: `application/json`
* **Request Schema**:
  - `review` (string, required, max length: 5000): The review text to analyze.
  - `model` (string, optional, default: `"lr"`): The classifier to use (`"lr"`, `"nb"`, or `"svm"`).

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
  }
}
```

---

## 3. Dataset & Model Statistics
Retrieve cached dataset metadata and evaluation metrics for all trained models.

* **Endpoint**: `GET /stats`

### Example Response (`200 OK`)
```json
{
  "total_reviews": 19418,
  "avg_confidence": 0.9167175967592068,
  "dataset_summary": {
    "total_reviews": 19418,
    "positive_count": 17554,
    "negative_count": 1864,
    "positive_percentage": 90.40065918220208,
    "negative_percentage": 9.59934081779792,
    "source": "Hugging Face McAuley-Lab/Amazon-Reviews-2023"
  },
  "models": {
    "lr": {
      "accuracy": 0.9307415036045315,
      "precision": 0.9308878256246678,
      "recall": 0.9974366277413842,
      "f1": 0.9630138869792383,
      "auc": 0.9607255023087149,
      "name": "Logistic Regression",
      "is_default": true
    },
    "nb": {
      "accuracy": 0.9070545829042225,
      "precision": 0.9067665289256198,
      "recall": 1.0,
      "f1": 0.9511038873086821,
      "auc": 0.9209058012237297,
      "name": "Multinomial Naive Bayes",
      "is_default": false
    },
    "svm": {
      "accuracy": 0.9495365602471678,
      "precision": 0.9615705931495405,
      "recall": 0.9834804898889206,
      "f1": 0.9724021402421853,
      "auc": 0.964340338255181,
      "name": "Linear SVM (Calibrated)",
      "is_default": false
    }
  },
  "reliability_summary": {
    "high_confidence_percentage": 75.74665293511843,
    "medium_confidence_percentage": 18.28012358393409,
    "low_confidence_percentage": 5.9732234809474765
  },
  "failure_modes": {
    "mixed_sentiment": 2.0,
    "sarcasm": 1.0,
    "comparative": 2.0,
    "short_review": 3.0,
    "negation_failure": 7.0
  }
}
```

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
* **`404 Not Found`**:
  - `ModelNotFoundError`: Raised if the specified `model` parameter is not one of `lr`, `nb`, or `svm`.
* **`500 Internal Server Error`**:
  - Raised for unexpected application errors or model parsing failures.
