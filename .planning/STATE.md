# ReviewLens AI — STATE.md

> **GSD Project Memory** | Auto-maintained | Last updated: 2026-06-06

---

## Current Status

| Field | Value |
|-------|-------|
| **Milestone** | 1.0 — MVP Complete |
| **Active Phase** | Phase 1 — Scaffolding & Setup |
| **Last Completed Phase** | None |
| **Next Action** | Run `/gsd-plan-phase 1` |

---

## Phase Completion Log

| Phase | Status | Completed | Notes |
|-------|--------|-----------|-------|
| 1 — Scaffolding | 🔲 Not Started | — | — |
| 2 — EDA | 🔲 Not Started | — | Depends on Phase 1 |
| 3 — ML Training | 🔲 Not Started | — | Depends on Phase 2 |
| 4 — ML Layer | 🔲 Not Started | — | Depends on Phase 3 |
| 5 — API Endpoints | 🔲 Not Started | — | Depends on Phase 4 |
| 6 — Next.js Foundation | 🔲 Not Started | — | Depends on Phase 1 |
| 7 — Analyzer Page | 🔲 Not Started | — | Depends on Phase 5, 6 |
| 8 — Dashboard Page | 🔲 Not Started | — | Depends on Phase 5, 6 |
| 9 — Batch Page | 🔲 Not Started | — | Depends on Phase 5, 6 |
| 10 — Integration & Polish | 🔲 Not Started | — | Depends on Phase 7, 8, 9 |

---

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Classical ML only (NB, LR, SVM) | Assignment scope, BERT as future work | 2026-06-06 |
| LinearSVC over Random Forest | Better text classification performance | 2026-06-06 |
| Keyword-based aspect extraction | Sufficient for mini-project, explainable | 2026-06-06 |
| No database | Simplicity, file-based state | 2026-06-06 |
| Models loaded at startup (lifespan) | Avoid 500ms+ per-request latency | 2026-06-06 |
| Retain negation words in stopword removal | Critical for sentiment ("not good" ≠ "good") | 2026-06-06 |

---

## Blockers & Risks

| Risk | Mitigation |
|------|-----------|
| Kaggle dataset requires account/API key | Download manually, place in `backend/data/raw/` |
| TF-IDF + NB may fail with negative values | Use `MultinomialNB` with non-negative TF-IDF (or `BernoulliNB`) |
| LinearSVC no native `predict_proba` | Wrap in `CalibratedClassifierCV` |
| CSV upload file size limit | Enforced in FastAPI route (5MB, 413 error) |

---

## Artifact Registry

| Artifact | Path | Phase | Status |
|----------|------|-------|--------|
| TF-IDF Vectorizer | `backend/models/vectorizer.pkl` | 3 | 🔲 |
| LR Model | `backend/models/sentiment_lr.pkl` | 3 | 🔲 |
| NB Model | `backend/models/sentiment_nb.pkl` | 3 | 🔲 |
| SVM Model | `backend/models/sentiment_svm.pkl` | 3 | 🔲 |
| Stats JSON | `backend/data/stats.json` | 3 | 🔲 |
| Cleaned CSV | `backend/data/processed_reviews.csv` | 2 | 🔲 |
| EDA Notebook | `notebooks/EDA.ipynb` | 2 | 🔲 |
| Training Notebook | `notebooks/Training.ipynb` | 3 | 🔲 |

---

## Environment

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
# Runs on http://localhost:3000

# Backend API
# http://localhost:8000
# Docs: http://localhost:8000/docs
```
