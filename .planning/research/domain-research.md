# ReviewLens AI — Domain Research

> **GSD Research** | Phase: Pre-planning | Date: 2026-06-06

---

## 1. Dataset Research

### Recommended Kaggle Datasets

**Option A — Amazon Reviews for Sentiment Analysis (Xiang Zhang)**
- URL: `https://www.kaggle.com/datasets/bittlingmayer/amazonreviews`
- Size: 3.6M reviews, binary labeled (1/2 star = negative, 4/5 star = positive)
- Format: CSV with `label` and `text` columns
- ✅ Best choice — pre-labeled, large, binary

**Option B — Amazon Product Reviews (McAuley)**
- URL: `https://www.kaggle.com/datasets/saurav9786/amazon-product-reviews`
- Size: ~500k electronics reviews
- Format: JSON with `reviewText`, `overall`, `reviewerID`, `asin`
- ✅ More structured, has star ratings to derive labels

**Option C — boAt Product Reviews**
- URL: Search Kaggle for "boAt reviews"
- May not exist as clean dataset; supplement Option A/B with manual scraping if needed

**Recommendation:** Use Option A for training scale + Option B for structured metadata.

---

## 2. Key Python Libraries

### ML Stack
```
scikit-learn>=1.3.0    # Models, TF-IDF, CalibratedClassifierCV
nltk>=3.8.1            # Tokenization, stopwords, lemmatization
contractions>=0.1.73   # Expand don't → do not
pandas>=2.0.0          # Data manipulation
numpy>=1.24.0          # Numerical operations
joblib>=1.3.0          # Model persistence
matplotlib>=3.7.0      # Plotting
seaborn>=0.12.0        # Confusion matrix heatmaps
```

### Backend Stack
```
fastapi>=0.104.0       # API framework
uvicorn[standard]>=0.24.0  # ASGI server
pydantic>=2.0.0        # Request/response validation
python-multipart>=0.0.6    # File upload support
```

---

## 3. NLTK Setup Note

NLTK resources must be downloaded before use:
```python
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')
```

Run this in a setup cell at the top of each notebook.

---

## 4. CalibratedClassifierCV — Key Note

`LinearSVC` does not natively support `predict_proba()`. The wrapper:
```python
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV

svc = LinearSVC(max_iter=2000)
svm_model = CalibratedClassifierCV(svc, cv=5)
svm_model.fit(X_train, y_train)
# Now svm_model.predict_proba() works
```
This adds cross-validation overhead during training. Use `cv=3` if training is slow.

---

## 5. TF-IDF + MultinomialNB Compatibility

`MultinomialNB` requires non-negative features. TF-IDF with `sublinear_tf=True` produces non-negative values, so this is fine. However, if you add any features (review length, etc.), ensure they are also non-negative before passing to `MultinomialNB`.

Alternative: use `ComplementNB` which often outperforms `MultinomialNB` on imbalanced text data.

---

## 6. Aspect Extraction Strategy

The keyword-matching approach is intentionally simple:
```python
import re

def extract_aspects(text, ml_predictor):
    results = []
    sentences = sent_tokenize(text)
    for aspect, keywords in ASPECTS.items():
        for sentence in sentences:
            if any(kw in sentence.lower() for kw in keywords):
                sentiment, confidence = ml_predictor(sentence)
                results.append({
                    "aspect": aspect,
                    "sentiment": sentiment,
                    "confidence": confidence
                })
                break  # one entry per aspect per review
    return results
```

This is O(aspects × sentences × keywords) — fast enough for single reviews.

---

## 7. Next.js 14 App Router Notes

- Server Components are default; use `"use client"` only for interactive components
- Data fetching in `useEffect` is client-side; for static stats page could use Server Components
- For this project: keep all pages as client components (`"use client"`) for simplicity with useState
- Tailwind CSS v3.x is default with Next.js 14 via `create-next-app`

---

## 8. Recharts Setup

```bash
npm install recharts
```

Key components used:
- `PieChart` + `Pie` + `Cell` — for sentiment donut
- `BarChart` + `Bar` + `XAxis` + `YAxis` + `Tooltip` — for reliability breakdown
- `ResponsiveContainer` — wraps all charts for responsive sizing

---

## 9. Reliability Analysis — Academic Context

The failure analysis table is the key differentiator for the assignment. Frame it this way in the report:

> "We identify 5 systematic failure modes in our classifier:
> 1. **Mixed sentiment** — 43% of errors. The model predicts a single polarity for reviews containing both praise and criticism.
> 2. **Sarcasm** — 18% of errors. Linear models cannot detect irony without additional features.
> 3. **Comparative statements** — 12% of errors. 'Better than X' doesn't mean the product is good.
> 4. **Short reviews** — 15% of errors. Insufficient context for reliable classification.
> 5. **Negation failure** — 12% of errors. Despite retaining negation words, complex negation patterns slip through."

These percentages are illustrative — adjust based on your actual analysis.

---

## 10. Trust Score Rationale

The trust score is a lightweight fake-review heuristic, not a ground truth. Frame it as:

> "We implement a heuristic trust score as a supplementary signal. It penalizes reviews exhibiting common patterns associated with inauthentic content: extreme brevity, all-caps writing, excessive punctuation, and repetitive vocabulary. We do not claim this is a reliable fake-review detector — it is a flag for human review."
