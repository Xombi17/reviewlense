# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-06-06
**Phases:** 10 | **Plans:** 18 | **Sessions:** 1

### What Was Built
- Full ML sentiment pipeline (TF-IDF vectorizer + Naive Bayes, Logistic Regression, Linear SVM models) serialized to pkl.
- FastAPI backend serving `/predict`, `/batch`, and `/stats` endpoints with Pydantic validations.
- Next.js frontend with modern typography, layout, and pages for Review Analyzer, Dashboard, and CSV Batch Upload.

### What Worked
- End-to-end type safety between FastAPI and Next.js simplified interface development.
- Splitting tasks into granular waves ensured solid incremental progress.
- Decoupling training (in Jupyter notebooks) from active serving (FastAPI) kept the codebase clean.

### What Was Inefficient
- Aspect extraction using keyword matching is simple, but might fail on complex linguistic patterns (lexicon limitation).
- Processing batch files entirely in memory can lead to resource constraints on large uploads.

### Patterns Established
- Component-driven Next.js layout structure utilizing Recharts.
- Lifespan backend model loader prevents per-request loading latency.

### Key Lessons
1. Clear type definitions on both backend and frontend prevent integration runtime errors.
2. Standardizing API errors early helps create consistent UI alerts.

### Cost Observations
- Model mix: 100% Gemini 3.5 Flash
- Sessions: 1
- Notable: Very fast responses and low token cost.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 10 | Initial workflow execution |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 40 | 100% | 0 |

### Top Lessons (Verified Across Milestones)

1. Standardizing API error handling simplifies UI resilience.
2. Stratified train/test splits are critical for training balanced classifiers.
