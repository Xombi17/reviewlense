import math

import numpy as np
import pytest

from backend.experiments.metrics import (
    bootstrap_ci,
    brier_score,
    confidence,
    expected_calibration_error,
    fit_temperature,
    mcnemar_test,
    negative_log_likelihood,
    paired_bootstrap_accuracy_diff,
    reliability_bins,
    risk_coverage,
    sigmoid,
    summarize,
    tier_breakdown,
)


def _simulate(n=60000, true_temperature=1.0, seed=0):
    """Logits z where the true P(y=1) is sigmoid(z / true_temperature)."""
    rng = np.random.default_rng(seed)
    logits = rng.normal(0, 3, n)
    labels = (rng.random(n) < sigmoid(logits / true_temperature)).astype(int)
    return labels, logits


def test_nll_and_brier_known_values():
    assert negative_log_likelihood(np.array([1]), np.array([0.0])) == pytest.approx(math.log(2))
    assert brier_score(np.array([1, 0]), np.array([0.0, 0.0])) == pytest.approx(0.25)


def test_confidence_is_at_least_half_and_symmetric():
    logits = np.array([-4.0, -0.1, 0.0, 0.1, 4.0])
    conf = confidence(logits)
    assert np.all(conf >= 0.5) and np.all(conf <= 1.0)
    assert conf[0] == pytest.approx(conf[-1])


def test_ece_is_small_for_a_calibrated_model():
    labels, logits = _simulate(true_temperature=1.0)
    assert expected_calibration_error(labels, logits) < 0.01


def test_ece_is_large_for_an_overconfident_model():
    labels, logits = _simulate(true_temperature=3.0)
    assert expected_calibration_error(labels, logits) > 0.08


def test_temperature_scaling_recovers_true_temperature_and_fixes_ece():
    labels, logits = _simulate(true_temperature=3.0)
    temperature = fit_temperature(labels, logits)

    assert temperature == pytest.approx(3.0, rel=0.1)
    before = expected_calibration_error(labels, logits)
    after = expected_calibration_error(labels, logits, temperature)
    assert after < before / 4
    assert negative_log_likelihood(labels, logits, temperature) < negative_log_likelihood(labels, logits)


def test_max_confidence_lands_in_last_reliability_bin():
    bins = reliability_bins(np.array([1, 0]), np.array([40.0, -40.0]))
    assert bins[-1]["count"] == 2
    assert sum(b["count"] for b in bins) == 2


def test_risk_coverage_rewards_good_confidence_ranking():
    # 90 confident correct predictions, 10 unconfident wrong ones
    logits = np.concatenate([np.full(90, 5.0), np.full(10, 0.2)])
    labels = np.concatenate([np.ones(90), np.zeros(10)]).astype(int)
    result = risk_coverage(labels, logits)

    assert result["accuracy_at_coverage"]["1.00"] == pytest.approx(0.90)
    assert result["accuracy_at_coverage"]["0.90"] == pytest.approx(1.0)
    assert result["aurc"] < 0.10  # better than abstaining at random


def test_tier_breakdown_partitions_all_predictions():
    labels, logits = _simulate(n=5000)
    tiers = tier_breakdown(labels, logits)

    assert sum(t["count"] for t in tiers.values()) == 5000
    assert sum(t["share"] for t in tiers.values()) == pytest.approx(1.0)
    assert tiers["HIGH"]["accuracy"] > tiers["LOW"]["accuracy"]


def test_mcnemar_exact_counts_and_p_value():
    labels = np.ones(30, dtype=int)
    logits_a = np.full(30, 2.0)  # always correct
    logits_b = np.full(30, 2.0)
    logits_b[:10] = -2.0  # wrong on 10 rows where A is right

    result = mcnemar_test(labels, logits_a, logits_b)

    assert (result["only_a_correct"], result["only_b_correct"]) == (10, 0)
    assert result["p_value"] == pytest.approx(2 * 0.5**10)


def test_mcnemar_identical_models_give_p_one():
    labels, logits = _simulate(n=200)
    assert mcnemar_test(labels, logits, logits)["p_value"] == 1.0


def test_bootstrap_ci_brackets_point_estimate():
    labels, logits = _simulate(n=2000)
    accuracy = float(np.mean((logits > 0).astype(int) == labels))
    low, high = bootstrap_ci(lambda y, z: float(np.mean((z > 0).astype(int) == y)), labels, logits)
    assert low <= accuracy <= high
    assert high - low < 0.06


def test_paired_bootstrap_diff_is_zero_for_identical_models():
    labels, logits = _simulate(n=500)
    result = paired_bootstrap_accuracy_diff(labels, logits, logits)
    assert result["diff"] == 0.0 and result["ci_low"] == 0.0 and result["ci_high"] == 0.0


def test_summarize_reports_expected_keys():
    labels, logits = _simulate(n=1000)
    summary = summarize(labels, logits, n_boot=50)
    for key in ("accuracy", "f1", "auc", "nll", "brier", "ece", "accuracy_ci", "auc_ci", "ece_ci"):
        assert key in summary
