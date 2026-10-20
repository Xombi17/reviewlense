"""Classical baselines: TF-IDF features with Logistic Regression and Naive Bayes.

Hyperparameters are chosen on the validation split only. ``preprocess="clean"`` applies
the production ``clean_review_text`` pipeline (stopword removal, lemmatisation) so its
effect can be ablated against feeding the vectorizer raw text.
"""

import time
from typing import Dict, Iterable, List, Sequence

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB

from .metrics import predict_labels

LR_C_GRID = (0.5, 2.0, 8.0, 32.0)
NB_ALPHA_GRID = (0.03, 0.1, 0.3, 1.0)


def _clean(texts: Iterable[str]) -> List[str]:
    try:
        from ml.preprocessing import clean_review_text
    except ImportError:  # imported as backend.experiments from the repo root
        from backend.ml.preprocessing import clean_review_text
    return [clean_review_text(text) for text in texts]


def preprocess_texts(texts: Sequence[str], mode: str) -> List[str]:
    if mode == "raw":
        return list(texts)
    if mode == "clean":
        return _clean(texts)
    raise ValueError(f"Unknown preprocess mode: {mode!r} (expected 'raw' or 'clean')")


def build_vectorizer(max_features: int = 100_000) -> TfidfVectorizer:
    return TfidfVectorizer(
        max_features=max_features,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,
        dtype=np.float32,
    )


def _log_odds_from_nb(model: MultinomialNB, features) -> np.ndarray:
    log_proba = model.predict_log_proba(features)
    return log_proba[:, 1] - log_proba[:, 0]


def _at_grid_edge(value: float, grid: Sequence[float]) -> bool:
    """True when the chosen value is the smallest or largest tried, so a better one may lie outside."""
    return len(grid) > 1 and value in (min(grid), max(grid))


def run_tfidf_baselines(
    train_text: Sequence[str],
    y_train: np.ndarray,
    val_text: Sequence[str],
    y_val: np.ndarray,
    test_text: Sequence[str],
    preprocess: str = "raw",
    max_features: int = 100_000,
    seed: int = 42,
    lr_c_grid: Sequence[float] = LR_C_GRID,
    nb_alpha_grid: Sequence[float] = NB_ALPHA_GRID,
) -> Dict[str, Dict[str, object]]:
    """Fit LR and NB; return validation and test log-odds plus the chosen settings."""
    started = time.time()
    train_text = preprocess_texts(train_text, preprocess)
    val_text = preprocess_texts(val_text, preprocess)
    test_text = preprocess_texts(test_text, preprocess)

    vectorizer = build_vectorizer(max_features)
    x_train = vectorizer.fit_transform(train_text)
    x_val = vectorizer.transform(val_text)
    vectorize_seconds = time.time() - started
    test_started = time.time()
    x_test = vectorizer.transform(test_text)
    test_vectorize_seconds = time.time() - test_started

    results: Dict[str, Dict[str, object]] = {}

    best = None
    for c_value in lr_c_grid:
        fit_started = time.time()
        model = LogisticRegression(C=c_value, max_iter=2000, random_state=seed)
        model.fit(x_train, y_train)
        val_logits = model.decision_function(x_val)
        accuracy = float(np.mean(predict_labels(val_logits) == y_val))
        if best is None or accuracy > best["val_accuracy"]:
            best = {
                "val_accuracy": accuracy,
                "model": model,
                "C": c_value,
                "fit_seconds": time.time() - fit_started,
            }
    predict_started = time.time()
    lr_test_logits = best["model"].decision_function(x_test)
    lr_predict_seconds = time.time() - predict_started
    results["tfidf-lr"] = {
        "val_logits": best["model"].decision_function(x_val),
        "test_logits": lr_test_logits,
        "config": {
            "preprocess": preprocess,
            "max_features": max_features,
            "C": best["C"],
            "grid": list(lr_c_grid),
            "at_grid_edge": _at_grid_edge(best["C"], lr_c_grid),
            "val_accuracy_at_selection": best["val_accuracy"],
        },
        "train_seconds": vectorize_seconds + best["fit_seconds"],
        "inference_seconds": test_vectorize_seconds + lr_predict_seconds,
    }

    best = None
    for alpha in nb_alpha_grid:
        fit_started = time.time()
        model = MultinomialNB(alpha=alpha)
        model.fit(x_train, y_train)
        val_logits = _log_odds_from_nb(model, x_val)
        accuracy = float(np.mean(predict_labels(val_logits) == y_val))
        if best is None or accuracy > best["val_accuracy"]:
            best = {
                "val_accuracy": accuracy,
                "model": model,
                "alpha": alpha,
                "fit_seconds": time.time() - fit_started,
            }
    predict_started = time.time()
    nb_test_logits = _log_odds_from_nb(best["model"], x_test)
    nb_predict_seconds = time.time() - predict_started
    results["tfidf-nb"] = {
        "val_logits": _log_odds_from_nb(best["model"], x_val),
        "test_logits": nb_test_logits,
        "config": {
            "preprocess": preprocess,
            "max_features": max_features,
            "alpha": best["alpha"],
            "grid": list(nb_alpha_grid),
            "at_grid_edge": _at_grid_edge(best["alpha"], nb_alpha_grid),
            "val_accuracy_at_selection": best["val_accuracy"],
        },
        "train_seconds": vectorize_seconds + best["fit_seconds"],
        "inference_seconds": test_vectorize_seconds + nb_predict_seconds,
    }
    return results
