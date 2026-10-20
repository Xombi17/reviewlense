"""Dataset loading and deterministic train/validation/test splitting.

Every model in an experiment is trained and evaluated on the same splits. Models are
fitted on ``train``, tuned and calibrated on ``val`` and scored once on ``test``.
"""

import hashlib
import os
from dataclasses import dataclass
from typing import Dict

import pandas as pd
from sklearn.model_selection import train_test_split

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_DIR = os.path.dirname(BACKEND_DIR)
LOCAL_REVIEWS_PATH = os.path.join(REPO_DIR, "test_csvs", "all_reviews_raw.csv")

HF_DATASET_ID = "fancyzhx/amazon_polarity"


@dataclass
class Splits:
    train: pd.DataFrame
    val: pd.DataFrame
    test: pd.DataFrame

    def sizes(self) -> Dict[str, int]:
        return {"train": len(self.train), "val": len(self.val), "test": len(self.test)}


def _join_title_and_body(title: pd.Series, body: pd.Series) -> pd.Series:
    return (title.fillna("").astype(str) + ". " + body.fillna("").astype(str)).str.strip()


def load_local_reviews(path: str = LOCAL_REVIEWS_PATH) -> pd.DataFrame:
    """The 20k raw Amazon polarity reviews checked into the repo (title, review_text, sentiment)."""
    raw = pd.read_csv(path)
    frame = pd.DataFrame(
        {
            "text": _join_title_and_body(raw["title"], raw["review_text"]),
            "label": raw["sentiment"].astype(int),
            "body": raw["review_text"].astype(str),
        }
    )
    return frame


def load_hf_amazon_polarity(n_total: int, seed: int = 42) -> pd.DataFrame:
    """Sample ``n_total`` reviews from the Amazon polarity train split on the Hugging Face hub.

    Requires the ``datasets`` package and network access to huggingface.co.
    """
    from datasets import load_dataset

    dataset = load_dataset(HF_DATASET_ID, split="train")
    dataset = dataset.shuffle(seed=seed).select(range(min(n_total, len(dataset))))
    frame = dataset.to_pandas()
    return pd.DataFrame(
        {
            "text": _join_title_and_body(frame["title"], frame["content"]),
            "label": frame["label"].astype(int),
            "body": frame["content"].astype(str),
        }
    )


def make_splits(
    frame: pd.DataFrame, seed: int = 42, val_fraction: float = 0.1, test_fraction: float = 0.1
) -> Splits:
    """Deduplicate on review body, then split stratified by label.

    Duplicate bodies are dropped before splitting so a near-copy of a test review can
    never appear in train, which would inflate every metric.
    """
    deduplicated = frame.drop_duplicates(subset="body").drop_duplicates(subset="text")
    deduplicated = deduplicated.drop(columns="body").reset_index(drop=True)

    train_val, test = train_test_split(
        deduplicated,
        test_size=test_fraction,
        stratify=deduplicated["label"],
        random_state=seed,
    )
    train, val = train_test_split(
        train_val,
        test_size=val_fraction / (1.0 - test_fraction),
        stratify=train_val["label"],
        random_state=seed,
    )
    return Splits(
        train=train.reset_index(drop=True),
        val=val.reset_index(drop=True),
        test=test.reset_index(drop=True),
    )


def fingerprint(splits: Splits) -> str:
    """Short hash of the split contents, recorded with results to prove runs share data."""
    digest = hashlib.sha256()
    for name in ("train", "val", "test"):
        part = getattr(splits, name)
        digest.update(name.encode())
        digest.update(pd.util.hash_pandas_object(part, index=False).values.tobytes())
    return digest.hexdigest()[:12]


def load_splits(source: str = "local", n_total: int = 100_000, seed: int = 42) -> Splits:
    if source == "local":
        frame = load_local_reviews()
    elif source == "hf":
        frame = load_hf_amazon_polarity(n_total=n_total, seed=seed)
    else:
        raise ValueError(f"Unknown data source: {source!r} (expected 'local' or 'hf')")
    return make_splits(frame, seed=seed)
