"""Evaluation and calibration metrics shared by every model in the comparison.

Every model is reduced to the same interface so results are directly comparable:

    y_true : (n,) ints in {0, 1}
    logits : (n,) floats, the log-odds of class 1 (z = log p1 - log p0)

Probabilities are ``sigmoid(logits / T)``, where ``T`` is a temperature fitted on
validation data only (``T = 1`` means uncalibrated).
"""

from typing import Callable, Dict, List, Tuple

import numpy as np
from scipy.optimize import minimize_scalar
from scipy.stats import binomtest
from sklearn.metrics import f1_score, roc_auc_score

ECE_BINS = 10
COVERAGE_LEVELS = (1.0, 0.9, 0.8, 0.7, 0.5)


def sigmoid(logits: np.ndarray) -> np.ndarray:
    return 0.5 * (1.0 + np.tanh(0.5 * np.asarray(logits, dtype=np.float64)))


def predict_labels(logits: np.ndarray) -> np.ndarray:
    return (np.asarray(logits) > 0).astype(int)


def confidence(logits: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    """Top-label confidence, i.e. max(p, 1 - p); always in [0.5, 1]."""
    probs = sigmoid(np.asarray(logits, dtype=np.float64) / temperature)
    return np.maximum(probs, 1.0 - probs)


def negative_log_likelihood(y_true: np.ndarray, logits: np.ndarray, temperature: float = 1.0) -> float:
    signs = 2.0 * np.asarray(y_true, dtype=np.float64) - 1.0
    scaled = np.asarray(logits, dtype=np.float64) / temperature
    return float(np.mean(np.logaddexp(0.0, -signs * scaled)))


def brier_score(y_true: np.ndarray, logits: np.ndarray, temperature: float = 1.0) -> float:
    probs = sigmoid(np.asarray(logits, dtype=np.float64) / temperature)
    return float(np.mean((probs - np.asarray(y_true)) ** 2))


def reliability_bins(
    y_true: np.ndarray, logits: np.ndarray, temperature: float = 1.0, n_bins: int = ECE_BINS
) -> List[Dict[str, float]]:
    """Equal-width bins over top-label confidence in [0.5, 1]."""
    y_true = np.asarray(y_true)
    conf = confidence(logits, temperature)
    correct = (predict_labels(logits) == y_true).astype(float)
    edges = np.linspace(0.5, 1.0, n_bins + 1)
    # digitize against interior edges so conf == 1.0 lands in the last bin
    bin_ids = np.digitize(conf, edges[1:-1])

    bins: List[Dict[str, float]] = []
    for index in range(n_bins):
        mask = bin_ids == index
        count = int(mask.sum())
        bins.append(
            {
                "low": float(edges[index]),
                "high": float(edges[index + 1]),
                "count": count,
                "accuracy": float(correct[mask].mean()) if count else float("nan"),
                "confidence": float(conf[mask].mean()) if count else float("nan"),
            }
        )
    return bins


def expected_calibration_error(
    y_true: np.ndarray, logits: np.ndarray, temperature: float = 1.0, n_bins: int = ECE_BINS
) -> float:
    """Weighted mean gap between accuracy and confidence across confidence bins."""
    total = len(y_true)
    gap = 0.0
    for bin_ in reliability_bins(y_true, logits, temperature, n_bins):
        if bin_["count"]:
            gap += bin_["count"] / total * abs(bin_["accuracy"] - bin_["confidence"])
    return float(gap)


def fit_temperature(y_val: np.ndarray, val_logits: np.ndarray) -> float:
    """Temperature scaling (Guo et al., 2017): the T minimising validation NLL."""
    result = minimize_scalar(
        lambda temperature: negative_log_likelihood(y_val, val_logits, temperature),
        bounds=(0.05, 50.0),
        method="bounded",
    )
    return float(result.x)


def risk_coverage(
    y_true: np.ndarray, logits: np.ndarray, temperature: float = 1.0
) -> Dict[str, object]:
    """Selective prediction: accuracy when keeping only the most confident predictions.

    Returns accuracy at fixed coverage levels and the area under the risk-coverage
    curve (AURC, lower is better; 0 would mean every error is ranked last).
    """
    y_true = np.asarray(y_true)
    conf = confidence(logits, temperature)
    correct = (predict_labels(logits) == y_true).astype(float)

    order = np.argsort(-conf, kind="stable")
    sorted_correct = correct[order]
    kept = np.arange(1, len(order) + 1)
    risk_curve = 1.0 - np.cumsum(sorted_correct) / kept

    accuracy_at_coverage = {}
    for level in COVERAGE_LEVELS:
        n_keep = max(1, int(round(level * len(order))))
        accuracy_at_coverage[f"{level:.2f}"] = float(sorted_correct[:n_keep].mean())

    return {
        "accuracy_at_coverage": accuracy_at_coverage,
        "aurc": float(risk_curve.mean()),
        "curve": {
            "coverage": (kept / len(order)).tolist(),
            "risk": risk_curve.tolist(),
        },
    }


def tier_breakdown(
    y_true: np.ndarray,
    logits: np.ndarray,
    temperature: float = 1.0,
    high: float = 0.90,
    medium: float = 0.70,
) -> Dict[str, Dict[str, float]]:
    """Accuracy inside the API's HIGH / MEDIUM / LOW reliability tiers.

    A useful tiering should be monotonic: HIGH is more accurate than MEDIUM, which
    is more accurate than LOW.
    """
    y_true = np.asarray(y_true)
    conf = confidence(logits, temperature)
    correct = (predict_labels(logits) == y_true).astype(float)
    masks = {
        "HIGH": conf >= high,
        "MEDIUM": (conf >= medium) & (conf < high),
        "LOW": conf < medium,
    }
    return {
        tier: {
            "share": float(mask.mean()),
            "count": int(mask.sum()),
            "accuracy": float(correct[mask].mean()) if mask.any() else float("nan"),
        }
        for tier, mask in masks.items()
    }


def bootstrap_ci(
    metric: Callable[[np.ndarray, np.ndarray], float],
    y_true: np.ndarray,
    logits: np.ndarray,
    n_boot: int = 1000,
    seed: int = 0,
    alpha: float = 0.05,
) -> Tuple[float, float]:
    """Percentile bootstrap confidence interval for ``metric(y_true, logits)``."""
    y_true = np.asarray(y_true)
    logits = np.asarray(logits)
    rng = np.random.default_rng(seed)
    n = len(y_true)
    values = []
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        try:
            values.append(metric(y_true[idx], logits[idx]))
        except ValueError:  # resample contained a single class (AUC undefined)
            continue
    low, high = np.percentile(values, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(low), float(high)


def _accuracy(y_true: np.ndarray, logits: np.ndarray) -> float:
    return float(np.mean(predict_labels(logits) == y_true))


def paired_bootstrap_accuracy_diff(
    y_true: np.ndarray,
    logits_a: np.ndarray,
    logits_b: np.ndarray,
    n_boot: int = 1000,
    seed: int = 0,
    alpha: float = 0.05,
) -> Dict[str, float]:
    """Accuracy(A) - Accuracy(B) on the same resampled rows, with a percentile CI."""
    y_true = np.asarray(y_true)
    correct_a = (predict_labels(logits_a) == y_true).astype(float)
    correct_b = (predict_labels(logits_b) == y_true).astype(float)
    rng = np.random.default_rng(seed)
    n = len(y_true)
    diffs = np.empty(n_boot)
    for index in range(n_boot):
        idx = rng.integers(0, n, n)
        diffs[index] = correct_a[idx].mean() - correct_b[idx].mean()
    low, high = np.percentile(diffs, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return {
        "diff": float(correct_a.mean() - correct_b.mean()),
        "ci_low": float(low),
        "ci_high": float(high),
    }


def mcnemar_test(
    y_true: np.ndarray, logits_a: np.ndarray, logits_b: np.ndarray
) -> Dict[str, float]:
    """Exact McNemar test on the examples where exactly one model is correct."""
    y_true = np.asarray(y_true)
    correct_a = predict_labels(logits_a) == y_true
    correct_b = predict_labels(logits_b) == y_true
    only_a = int(np.sum(correct_a & ~correct_b))
    only_b = int(np.sum(~correct_a & correct_b))
    discordant = only_a + only_b
    p_value = 1.0 if discordant == 0 else float(binomtest(only_a, discordant, 0.5).pvalue)
    return {"only_a_correct": only_a, "only_b_correct": only_b, "p_value": p_value}


def summarize(
    y_true: np.ndarray,
    logits: np.ndarray,
    temperature: float = 1.0,
    n_boot: int = 1000,
    seed: int = 0,
    with_ci: bool = True,
) -> Dict[str, object]:
    """Headline metrics for one model at one temperature."""
    y_true = np.asarray(y_true)
    logits = np.asarray(logits, dtype=np.float64)
    preds = predict_labels(logits)

    summary: Dict[str, object] = {
        "temperature": float(temperature),
        "accuracy": float(np.mean(preds == y_true)),
        "f1": float(f1_score(y_true, preds)),
        "auc": float(roc_auc_score(y_true, logits)),
        "nll": negative_log_likelihood(y_true, logits, temperature),
        "brier": brier_score(y_true, logits, temperature),
        "ece": expected_calibration_error(y_true, logits, temperature),
    }

    if with_ci:
        summary["accuracy_ci"] = bootstrap_ci(_accuracy, y_true, logits, n_boot, seed)
        summary["auc_ci"] = bootstrap_ci(roc_auc_score, y_true, logits, n_boot, seed)
        summary["ece_ci"] = bootstrap_ci(
            lambda yt, lg: expected_calibration_error(yt, lg, temperature),
            y_true,
            logits,
            n_boot,
            seed,
        )
    return summary
