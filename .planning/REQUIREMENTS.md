# ReviewLens AI — REQUIREMENTS.md

> **Scoped Requirements** | Derived from PRD | Last updated: 2026-06-06

---

## R1 — ML Pipeline Requirements

### R1.1 Dataset & Preprocessing
- **R1.1.1** Source dataset from Kaggle Amazon Product Reviews (Electronics / audio)
- **R1.1.2** Minimum 10,000 clean reviews after preprocessing
- **R1.1.3** Labels: Stars 4–5 → Positive (1) | Stars 1–2 → Negative (0) | Star 3 → Discard
- **R1.1.4** Preprocessing pipeline (in order):
  1. Drop null/empty `reviewText` rows
  2. Lowercase all text
  3. Strip HTML tags, URLs, special chars (keep apostrophes)
  4. Expand contractions (`contractions` library)
  5. Tokenize (NLTK `word_tokenize`)
  6. Remove stopwords, **retain negation words**: `not, no, never, hardly, barely`
  7. Lemmatize (NLTK `WordNetLemmatizer`)
  8. Rejoin tokens
- **R1.1.5** Drop reviews with only emojis, < 3 tokens after cleaning, or non-ASCII-only content
- **R1.1.6** Flag all-caps reviews in trust score

### R1.2 Feature Engineering
- **R1.2.1** Primary vectorizer: TF-IDF with `max_features=20000, ngram_range=(1,2), min_df=2, max_df=0.95, sublinear_tf=True`
- **R1.2.2** Optional additional features: review length, exclamation count, negation word count, capitalized word ratio

### R1.3 Models
- **R1.3.1** Train three models on identical TF-IDF features and 80/20 stratified split:
  - Multinomial Naive Bayes (`MultinomialNB`)
  - Logistic Regression (`LogisticRegression(max_iter=1000, C=1.0)`)
  - Linear SVM (`LinearSVC` wrapped in `CalibratedClassifierCV`)
- **R1.3.2** Persist all models with joblib to `backend/models/`

### R1.4 Evaluation
- **R1.4.1** Report Accuracy, Precision, Recall, F1 for each model
- **R1.4.2** Generate Confusion Matrix (seaborn heatmap)
- **R1.4.3** Generate ROC Curve with AUC score
- **R1.4.4** Select final model by best F1 score (expected: LR or SVM)

### R1.5 Reliability Analysis (Core Assignment Requirement)
- **R1.5.1** Compute confidence = `max(predict_proba[neg], predict_proba[pos])`
- **R1.5.2** Reliability tiers: HIGH ≥ 0.90 | MEDIUM 0.70–0.89 | LOW 0.50–0.69
- **R1.5.3** Flag `uncertain_prediction` if confidence < 0.70
- **R1.5.4** Build failure analysis table: 10–15 wrong predictions with review text, predicted label, true label, confidence, and failure category
- **R1.5.5** Failure categories: `mixed_sentiment`, `sarcasm`, `comparative`, `short_review`, `negation_failure`

### R1.6 Aspect Extraction
- **R1.6.1** Keyword-based extraction against 8 aspect dictionaries: battery, sound, build, comfort, connectivity, delivery, price, mic
- **R1.6.2** Extract sentence containing keyword, run ML model on that sentence
- **R1.6.3** Return only detected aspects (not all 8 for every review)
- **R1.6.4** Output: `{ aspect, sentiment, confidence }` per detected aspect

### R1.7 Trust Score
- **R1.7.1** Heuristic score 0.0–1.0. Start at 1.0, apply penalties:
  - Review length < 20 chars → -0.3
  - All uppercase → -0.2
  - Exclamation marks > 3 → -0.1
  - Repeating words (same word > 3× ) → -0.15
- **R1.7.2** Floor at 0.0
- **R1.7.3** Flag `suspicious_review` if trust score < 0.5

---

## R2 — Backend (FastAPI) Requirements

### R2.1 Framework & Setup
- **R2.1.1** FastAPI with Python 3.10+
- **R2.1.2** CORS enabled for `http://localhost:3000`
- **R2.1.3** Pydantic v2 for all request/response schemas
- **R2.1.4** Load all models at startup via FastAPI lifespan context (not per-request)

### R2.2 POST /predict
- **R2.2.1** Accept: `{ review: str, model?: "lr" | "nb" | "svm" }` (model defaults to "lr")
- **R2.2.2** Validate: review must be 3–5000 chars, non-empty
- **R2.2.3** Apply same preprocessing pipeline as training
- **R2.2.4** Return: `{ sentiment, confidence, reliability, aspects, trust_score, flags, model_used }`
- **R2.2.5** Flags: `uncertain_prediction` | `mixed_sentiment` | `suspicious_review` | `very_short_review`

### R2.3 POST /batch
- **R2.3.1** Accept: `multipart/form-data` CSV upload
- **R2.3.2** CSV must have `reviewText` column
- **R2.3.3** Max file size: 5MB | Max rows: 2000
- **R2.3.4** Return aggregated: total/processed/skipped, sentiment distribution, avg confidence, top complaints, top praised, suspicious count, reliability breakdown

### R2.4 GET /stats
- **R2.4.1** Return precomputed dataset + model evaluation statistics (from `data/stats.json`)
- **R2.4.2** Includes dataset summary and metrics for all 3 models

### R2.5 Error Handling
- **R2.5.1** All errors return `{ error: true, code: str, message: str }`
- **R2.5.2** Error codes: `VALIDATION_ERROR` (422), `EMPTY_REVIEW` (400), `FILE_TOO_LARGE` (413), `MISSING_COLUMN` (400), `MODEL_NOT_FOUND` (400), `INTERNAL_ERROR` (500)

---

## R3 — Frontend (Next.js) Requirements

### R3.1 Framework & Setup
- **R3.1.1** Next.js 14 with App Router, TypeScript, Tailwind CSS, Recharts
- **R3.1.2** All API calls centralized in `lib/api.ts`
- **R3.1.3** TypeScript interfaces in `lib/types.ts` match backend Pydantic schemas exactly

### R3.2 Navbar
- **R3.2.1** Three links: ReviewLens AI (home `/`), Dashboard (`/dashboard`), Batch Analysis (`/batch`)
- **R3.2.2** Active link visually highlighted

### R3.3 Analyzer Page (`/`)
- **R3.3.1** Large textarea for review input (min 4 rows)
- **R3.3.2** Model selector dropdown (LR default)
- **R3.3.3** Submit button disabled if review < 10 chars
- **R3.3.4** Example review chips (clickable, autofill textarea)
- **R3.3.5** Loading skeleton during API call
- **R3.3.6** Results panel (fade+slide animation) showing: Sentiment Badge, Confidence Bar, Reliability Tag, Flags, Aspect chips, Trust Score

### R3.4 Dashboard Page (`/dashboard`)
- **R3.4.1** Four stat cards: Total Reviews, Positive (%), Negative (%), Dataset Source
- **R3.4.2** Recharts donut PieChart (positive vs negative)
- **R3.4.3** Model Comparison Table (Accuracy, Precision, Recall, F1, Default marker)
- **R3.4.4** Reliability Breakdown BarChart (HIGH/MEDIUM/LOW percentages)
- **R3.4.5** Common Failure Types visualization

### R3.5 Batch Analysis Page (`/batch`)
- **R3.5.1** Drag-and-drop or click CSV upload zone
- **R3.5.2** Requirement hint: "CSV must have a column named reviewText"
- **R3.5.3** Loading spinner during upload/processing
- **R3.5.4** Results: Summary cards, sentiment PieChart, top complaints/praised lists, reliability breakdown, skipped reviews note

---

## R4 — Integration Requirements

### R4.1 Data Contracts
- **R4.1.1** Notebook outputs: `vectorizer.pkl`, `sentiment_lr.pkl`, `sentiment_nb.pkl`, `sentiment_svm.pkl` → `backend/models/`
- **R4.1.2** Notebook outputs: `stats.json` → `backend/data/stats.json`
- **R4.1.3** Frontend TypeScript types mirror backend Pydantic models exactly

### R4.2 Startup
- **R4.2.1** Backend: `uvicorn main:app --reload --port 8000`
- **R4.2.2** Frontend: `npm run dev` (port 3000)
- **R4.2.3** Models must be pre-generated (notebooks run offline before server start)

---

## Constraints

- English reviews only
- Classical ML only (no BERT/transformers)
- No real-time web scraping
- No authentication
- No production deployment required
- No database (file-based state only)
