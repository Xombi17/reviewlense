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


def test_hf_loader_maps_amazon_polarity_columns(monkeypatch):
    datasets = pytest.importorskip("datasets")
    from backend.experiments import data

    rows = {
        "label": [i % 2 for i in range(50)],
        "title": [f"title {i}" for i in range(50)],
        "content": [f"body of review number {i}" for i in range(50)],
    }
    seen = {}

    def fake_load_dataset(dataset_id, split):
        seen["call"] = (dataset_id, split)
        return datasets.Dataset.from_dict(rows)

    monkeypatch.setattr(datasets, "load_dataset", fake_load_dataset)

    frame = data.load_hf_amazon_polarity(n_total=20, seed=1)

    assert seen["call"] == ("fancyzhx/amazon_polarity", "train")
    assert len(frame) == 20
    assert list(frame.columns) == ["text", "label", "body"]
    assert set(frame["label"]) <= {0, 1}
    # text is "title. body", and the label must stay attached to its own review
    for _, row in frame.iterrows():
        index = int(row["body"].rsplit(" ", 1)[1])
        assert row["text"] == f"title {index}. {row['body']}"
        assert row["label"] == index % 2
    # same seed gives the same sample; a different seed gives a different one
    again = data.load_hf_amazon_polarity(n_total=20, seed=1)
    other = data.load_hf_amazon_polarity(n_total=20, seed=2)
    assert frame["body"].tolist() == again["body"].tolist()
    assert frame["body"].tolist() != other["body"].tolist()


def test_hf_source_flows_through_make_splits(monkeypatch):
    datasets = pytest.importorskip("datasets")
    rows = {
        "label": [i % 2 for i in range(400)],
        "title": [f"t{i}" for i in range(400)],
        "content": [f"review text {i} " + ("good" if i % 2 else "bad") for i in range(400)],
    }
    monkeypatch.setattr(datasets, "load_dataset", lambda *a, **k: datasets.Dataset.from_dict(rows))

    from backend.experiments.data import load_splits

    splits = load_splits("hf", n_total=300, seed=3)
    assert sum(splits.sizes().values()) == 300
    # scikit-learn rounds split sizes up, so val can be one over the nominal 10%
    assert splits.sizes()["test"] == 30
    assert splits.sizes()["val"] in (30, 31)


def test_grid_edge_is_flagged_and_wider_grid_is_honoured():
    splits = make_splits(_frame(600), seed=1)
    args = (
        splits.train["text"], splits.train["label"].to_numpy(),
        splits.val["text"], splits.val["label"].to_numpy(), splits.test["text"],
    )
    results = run_tfidf_baselines(*args, max_features=500, lr_c_grid=(0.5, 2.0, 8.0), nb_alpha_grid=(0.1, 1.0))

    for entry in results.values():
        config = entry["config"]
        assert config["grid"] and isinstance(config["at_grid_edge"], bool)
    assert results["tfidf-lr"]["config"]["C"] in (0.5, 2.0, 8.0)
    assert results["tfidf-nb"]["config"]["alpha"] in (0.1, 1.0)

    from backend.experiments.tfidf_baseline import _at_grid_edge

    assert _at_grid_edge(8.0, (0.5, 2.0, 8.0)) and _at_grid_edge(0.5, (0.5, 2.0, 8.0))
    assert not _at_grid_edge(2.0, (0.5, 2.0, 8.0))
    assert not _at_grid_edge(1.0, (1.0,))  # a single-value grid has no edge to hit
