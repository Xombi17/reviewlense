# ReviewLens AI — ROADMAP.md

> **GSD Roadmap** | 10-Day Timeline | Last updated: 2026-06-06

---

## Milestone 1.0 — MVP Complete

**Goal:** A fully working ReviewLens AI — trained models, FastAPI backend, Next.js frontend, end-to-end integration.

---

## Phase 1 — Project Scaffolding & Environment Setup

**Description:** Initialize the repository structure, set up Python virtual environment, install dependencies, and create the Next.js app. No ML yet — just getting the skeleton in place.

**Rationale:** Scaffold first so all subsequent phases have a stable foundation. Environment issues caught early don't block ML work.

**Deliverables:**
- `backend/` directory structure with empty placeholder files
- `backend/requirements.txt` with all Python deps pinned
- `frontend/` initialized with Next.js 14, TypeScript, Tailwind CSS
- `notebooks/` directory with empty `EDA.ipynb` and `Training.ipynb`
- `README.md` with project overview and run instructions

**UAT:**
- `cd backend && pip install -r requirements.txt` completes without errors
- `cd frontend && npm install && npm run dev` starts on port 3000
- Directory structure matches PRD spec

**Depends on:** None

---

## Phase 2 — Dataset Acquisition & EDA

**Description:** Download the Amazon product reviews dataset from Kaggle, perform exploratory data analysis, and produce the cleaned CSV that will feed into training.

**Rationale:** EDA is required for the academic report and produces `processed_reviews.csv` which Phase 3 depends on. Understanding the data distribution is critical before choosing preprocessing parameters.

**Deliverables:**
- `notebooks/EDA.ipynb` — complete with:
  - Dataset loading and initial inspection (shape, dtypes, nulls)
  - Star rating distribution (bar chart)
  - Review length distribution (histogram)
  - Label balance (positive vs negative after 3-star discard)
  - Word cloud for positive and negative reviews
  - Top 20 most frequent words per class
  - Time-series trend of review counts (if `reviewTime` column present)
- `backend/data/raw/reviews.csv` — raw Kaggle download (gitignored)
- `backend/data/processed_reviews.csv` — cleaned, labeled dataset (10k+ rows)

**UAT:**
- `processed_reviews.csv` has columns: `clean_text`, `label`
- Row count ≥ 10,000
- Label distribution: column `label` has values 0 and 1 only
- EDA notebook runs cell-by-cell without errors

**Depends on:** Phase 1

---

## Phase 3 — ML Training & Model Persistence

**Description:** Train three sentiment classifiers (Naive Bayes, Logistic Regression, LinearSVM) on TF-IDF features, evaluate them, and save all artifacts. Also produce `stats.json` for the `/stats` endpoint.

**Rationale:** This is the core ML deliverable. All three models must be evaluated before selecting the default. The stats.json bridges the training notebook to the live backend.

**Deliverables:**
- `notebooks/Training.ipynb` — complete with:
  - TF-IDF vectorizer fitting
  - Training all three models on 80/20 stratified split
  - Accuracy, Precision, Recall, F1 for each model (table)
  - Confusion matrix heatmaps (seaborn)
  - ROC curves with AUC scores
  - Classification report (per-class)
  - Confidence distribution histogram per model
  - Reliability tier breakdown (HIGH/MEDIUM/LOW percentages)
  - **Failure analysis table**: 10–15 wrong predictions with text, predicted, true, confidence, failure category
  - Saving all artifacts
- `backend/models/vectorizer.pkl`
- `backend/models/sentiment_lr.pkl`
- `backend/models/sentiment_nb.pkl`
- `backend/models/sentiment_svm.pkl`
- `backend/data/stats.json`

**UAT:**
- All 4 pkl files exist and load without error
- `stats.json` matches the schema defined in B.4 of PRD
- LR F1 score ≥ 0.82 on test set
- Failure analysis table has ≥ 10 examples with categorized failure reasons

**Depends on:** Phase 2

---

## Phase 4 — FastAPI ML Layer (predictor, aspects, trust)

**Description:** Implement the ML serving layer in Python — model loader, prediction function with confidence/reliability, aspect extraction, and trust score. No API endpoints yet — just the Python functions.

**Rationale:** Isolating the ML logic from the HTTP layer makes it testable independently and follows the project's separation of concerns.

**Deliverables:**
- `backend/ml/loader.py` — loads all 4 pkl files at startup, stores in module-level dict
- `backend/ml/predictor.py` — `predict(text, model_key)` → `{ sentiment, confidence, reliability, flags }`
- `backend/ml/aspects.py` — `extract_aspects(text)` → `[{ aspect, sentiment, confidence }]`
- `backend/ml/trust.py` — `compute_trust_score(text)` → `float`
- `backend/ml/preprocessing.py` — shared text cleaning pipeline (same as training)

**UAT:**
- `from ml.predictor import predict; predict("battery life is amazing", "lr")` returns correct shape
- `from ml.aspects import extract_aspects; extract_aspects("battery is great but mic is bad")` returns 2 aspects
- `from ml.trust import compute_trust_score; compute_trust_score("GREAT!!!!")` returns score < 0.8
- Confidence values are floats between 0.5 and 1.0
- Reliability tiers assigned correctly per thresholds

**Depends on:** Phase 3

---

## Phase 5 — FastAPI Endpoints & Schemas

**Description:** Implement all three FastAPI endpoints — `/predict`, `/batch`, `/stats` — with Pydantic schemas, error handling, CORS, and the lifespan model loader.

**Rationale:** With the ML layer tested in Phase 4, wiring it to HTTP is straightforward. This phase makes the backend callable by curl and the frontend.

**Deliverables:**
- `backend/main.py` — FastAPI app with lifespan, CORS, router registration
- `backend/schemas/predict.py` — `PredictRequest`, `PredictResponse`
- `backend/schemas/batch.py` — `BatchResponse`
- `backend/schemas/stats.py` — `StatsResponse`
- `backend/routes/predict.py` — `POST /predict`
- `backend/routes/batch.py` — `POST /batch`
- `backend/routes/stats.py` — `GET /stats`

**UAT:**
```bash
# Server starts
uvicorn main:app --reload --port 8000

# Single predict
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"review": "Battery life is amazing but charging is slow"}'
# → 200 with sentiment, confidence, aspects (battery + charging)

# Stats
curl http://localhost:8000/stats
# → 200 with models array (3 models) and dataset info

# Validation error
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"review": ""}'
# → 400 EMPTY_REVIEW

# Batch upload
curl -X POST http://localhost:8000/batch \
  -F "file=@sample_reviews.csv"
# → 200 with sentiment_distribution
```

**Depends on:** Phase 4

---

## Phase 6 — Next.js Foundation (Layout, Types, API Client)

**Description:** Set up the Next.js app's shared infrastructure — root layout with Navbar, TypeScript types mirroring backend schemas, and the `lib/api.ts` client. No page logic yet.

**Rationale:** Getting types and the API client right before building pages prevents type mismatches and import chaos later. Navbar is shared by all pages.

**Deliverables:**
- `frontend/app/layout.tsx` — root layout with Navbar, global styles
- `frontend/components/Navbar.tsx` — three links, active state highlighting
- `frontend/lib/types.ts` — all TypeScript interfaces matching backend Pydantic schemas
- `frontend/lib/api.ts` — `analyzeReview()`, `uploadBatch()`, `getStats()` functions with proper types
- `frontend/app/globals.css` — base Tailwind config + any custom CSS variables

**UAT:**
- `npm run dev` starts without TypeScript errors
- Navbar renders on `/` and shows active state
- `analyzeReview()` in `api.ts` has correct request/response types matching `PredictResponse`
- No `any` types in `lib/types.ts`

**Depends on:** Phase 1

---

## Phase 7 — Analyzer Page (`/`)

**Description:** Build the primary demo page — the textarea input, model selector, submit button, and the full results panel with all sub-components.

**Rationale:** This is the flagship page. It demonstrates the full prediction pipeline to users and to academic reviewers. Every component in the `components/analyzer/` directory is built here.

**Deliverables:**
- `frontend/app/page.tsx` — Analyzer page layout
- `frontend/components/analyzer/ReviewInput.tsx` — textarea + model selector + submit
- `frontend/components/analyzer/SentimentBadge.tsx` — POSITIVE/NEGATIVE with color
- `frontend/components/analyzer/ConfidenceBar.tsx` — animated progress bar, color by tier
- `frontend/components/analyzer/ReliabilityTag.tsx` — HIGH/MEDIUM/LOW with tooltip
- `frontend/components/analyzer/AspectChips.tsx` — aspect pills with +/- indicator
- `frontend/components/analyzer/FlagsList.tsx` — warning chips for flags
- `frontend/components/analyzer/TrustScore.tsx` — score display with label
- Example review chips (clickable autofill): at least 4 examples

**UX Requirements:**
- Submit disabled if review < 10 chars (with inline hint)
- Loading skeleton during API call
- Results panel fade+slide animation on appearance
- Results panel hidden until first submission

**UAT:**
- Type "Battery dies in 2 hours" → click Analyze → results render
- Results show: Sentiment Badge (red, NEGATIVE), ConfidenceBar, ReliabilityTag, Aspect chip for "battery"
- Click example chip → textarea fills with example text
- Submit button is disabled when textarea is empty
- Loading skeleton appears for ~300ms minimum (mock if backend is fast)
- No TypeScript errors

**Depends on:** Phase 5, Phase 6

---

## Phase 8 — Dashboard Page (`/dashboard`)

**Description:** Build the model performance and dataset overview page. All data comes from `GET /stats`. Includes stat cards, donut chart, model comparison table, reliability bar chart, and failure type visualization.

**Rationale:** Required for academic evaluation. Shows the methodology rigor. Data is precomputed so this page has no real-time ML cost.

**Deliverables:**
- `frontend/app/dashboard/page.tsx` — Dashboard page layout
- `frontend/components/dashboard/DatasetSummary.tsx` — four stat cards
- `frontend/components/dashboard/SentimentDonut.tsx` — Recharts PieChart (donut)
- `frontend/components/dashboard/ModelComparisonTable.tsx` — table with metrics + default marker
- `frontend/components/dashboard/ReliabilityBreakdown.tsx` — Recharts BarChart (HIGH/MEDIUM/LOW)
- `frontend/components/dashboard/FailureTypesChart.tsx` — failure category visualization

**UAT:**
- Navigate to `/dashboard` → stat cards populate from `/stats` endpoint
- PieChart renders with correct positive/negative split
- Model table shows all 3 models with LR marked as default
- ReliabilityBreakdown chart renders with correct % values
- Page loads without console errors
- Loading state shown while `/stats` is fetching

**Depends on:** Phase 5, Phase 6

---

## Phase 9 — Batch Analysis Page (`/batch`)

**Description:** Build the CSV upload page with drag-and-drop, upload processing, and aggregate results visualization.

**Rationale:** Required by PRD for business analyst use case. Tests the `/batch` endpoint end-to-end with a real file upload.

**Deliverables:**
- `frontend/app/batch/page.tsx` — Batch page layout
- `frontend/components/batch/CsvUploader.tsx` — drag-and-drop zone with requirement hint
- `frontend/components/batch/BatchResultsSummary.tsx` — summary cards (total, pos, neg, uncertain, suspicious)
- `frontend/components/batch/BatchCharts.tsx` — sentiment PieChart + reliability BarChart
- Top complaints (red chips) and top praised (green chips) side-by-side lists
- Skipped reviews note at bottom

**UAT:**
- Drag CSV onto upload zone → file selected
- Click upload → spinner appears → results render on success
- Summary cards show correct counts
- Top complaints list shows red chips (e.g., "charging", "delivery")
- Error shown if CSV has no `reviewText` column
- Error shown if file > 5MB

**Depends on:** Phase 5, Phase 6

---

## Phase 10 — Integration Testing & Polish

**Description:** End-to-end integration testing, UI polish pass, error state handling, responsive layout check, and README completion.

**Rationale:** Individual phases may work in isolation but fail together. This phase finds integration gaps and ensures the project is demo-ready for academic submission.

**Deliverables:**
- End-to-end smoke test: start both servers → run all three user flows
- Error boundary on frontend for API failures
- Responsive layout check (1280px desktop minimum)
- `README.md` — complete with setup instructions, architecture diagram, how to run
- Final validation that all UAT from Phases 1–9 pass
- Screenshots for report (optional)

**UAT:**
```
Full Demo Flow:
1. Start backend: uvicorn main:app --reload --port 8000
2. Start frontend: npm run dev
3. Navigate to http://localhost:3000
4. Type: "Sound quality is amazing but battery backup is terrible"
5. Select model: SVM
6. Click Analyze
7. Verify: MIXED aspect chips (sound: positive, battery: negative)
8. Verify: mixed_sentiment flag appears
9. Navigate to /dashboard → all charts load
10. Navigate to /batch → upload sample CSV → results render
11. All without console errors
```

**Depends on:** Phase 7, Phase 8, Phase 9

---

## Phase Summary

| # | Phase | Est. Time | Key Output |
|---|-------|-----------|------------|
| 1 | Scaffolding & Setup | Day 1 | Directory structure, deps installed |
| 2 | Dataset & EDA | Day 2 | `EDA.ipynb`, `processed_reviews.csv` |
| 3 | ML Training | Day 3–4 | `.pkl` files, `stats.json`, `Training.ipynb` |
| 4 | FastAPI ML Layer | Day 5 | `predictor.py`, `aspects.py`, `trust.py` |
| 5 | FastAPI Endpoints | Day 5–6 | 3 working API endpoints |
| 6 | Next.js Foundation | Day 6 | Layout, types, API client |
| 7 | Analyzer Page | Day 7 | Full prediction UI |
| 8 | Dashboard Page | Day 8 | Stats/model comparison UI |
| 9 | Batch Page | Day 8–9 | CSV upload + results UI |
| 10 | Integration & Polish | Day 10 | Demo-ready, README complete |

---

## File Artifact Registry

```
backend/models/
├── vectorizer.pkl       ← Phase 3 output
├── sentiment_lr.pkl     ← Phase 3 output
├── sentiment_nb.pkl     ← Phase 3 output
└── sentiment_svm.pkl    ← Phase 3 output

backend/data/
├── raw/reviews.csv      ← Phase 2 (Kaggle download, gitignored)
├── processed_reviews.csv ← Phase 2 output
└── stats.json           ← Phase 3 output

notebooks/
├── EDA.ipynb            ← Phase 2
└── Training.ipynb       ← Phase 3
```
