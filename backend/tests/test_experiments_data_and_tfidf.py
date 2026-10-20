import numpy as np
import pandas as pd
import pytest

from backend.experiments.data import fingerprint, load_local_reviews, make_splits
from backend.experiments.metrics import predict_labels
from backend.experiments.tfidf_baseline import preprocess_texts, run_tfidf_baselines


def _frame(n=400):
    rng = np.random.default_rng(0)
    pos = ["great", "love", "excellent", "perfect"]
    neg = ["awful", "hate", "broken", "terrible"]
    rows = []
    for i in range(n):
        label = i % 2
        words = rng.choice(pos if label else neg, 5)
        text = f"{' '.join(words)} item number {i}"
        rows.append({"text": text, "label": label, "body": text})
    return pd.DataFrame(rows)


def test_splits_are_disjoint_stratified_and_deterministic():
    frame = _frame()
    first = make_splits(frame, seed=7)
    second = make_splits(frame, seed=7)

    assert fingerprint(first) == fingerprint(second)
    assert fingerprint(first) != fingerprint(make_splits(frame, seed=8))
    texts = [set(part["text"]) for part in (first.train, first.val, first.test)]
    assert not (texts[0] & texts[1]) and not (texts[0] & texts[2]) and not (texts[1] & texts[2])
    assert sum(first.sizes().values()) == len(frame)
    for part in (first.train, first.val, first.test):
        assert part["label"].mean() == pytest.approx(0.5, abs=0.02)


def test_make_splits_drops_duplicate_review_bodies():
    frame = _frame(100)
    duplicate = frame.iloc[[0]].copy()
    duplicate["text"] = "different title. " + duplicate["body"]
    splits = make_splits(pd.concat([frame, duplicate], ignore_index=True), seed=1)

    assert sum(splits.sizes().values()) == 100


def test_local_reviews_load_with_balanced_binary_labels():
    frame = load_local_reviews()
    assert set(frame["label"].unique()) == {0, 1}
    assert frame["text"].str.len().min() > 0


def test_tfidf_baselines_return_aligned_logits_and_beat_chance():
    splits = make_splits(_frame(600), seed=1)
    results = run_tfidf_baselines(
        splits.train["text"], splits.train["label"].to_numpy(),
        splits.val["text"], splits.val["label"].to_numpy(),
        splits.test["text"], preprocess="raw", max_features=500,
    )

    assert set(results) == {"tfidf-lr", "tfidf-nb"}
    for entry in results.values():
        assert entry["test_logits"].shape == (len(splits.test),)
        accuracy = np.mean(predict_labels(entry["test_logits"]) == splits.test["label"].to_numpy())
        assert accuracy > 0.95
        assert entry["inference_seconds"] >= 0


def test_unknown_preprocess_mode_is_rejected():
    with pytest.raises(ValueError):
        preprocess_texts(["x"], "stem")
