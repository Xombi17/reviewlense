"""Serve a fine-tuned transformer sentiment model with a calibrated confidence.

The model reads the review as written (it was trained and evaluated on raw text, not on the
cleaned text the TF-IDF models use). Its score is ``logit[1] - logit[0]``; the calibrated
probability of the positive class is ``sigmoid(score / temperature)``, where the temperature was
fitted on validation data at training time and stored in ``calibration.json`` beside the weights
(see ``experiments/run_experiment.py --save-model``).

torch and transformers are imported lazily so deployments that only serve the TF-IDF models do not
need them.
"""

import json
import math
import os
import re
from typing import Any, Dict, List, Optional, Sequence

import numpy as np

from .reliability import reliability_tier

CALIBRATION_FILE = "calibration.json"

# "name" or "owner/name": what a Hugging Face hub id looks like, as opposed to a filesystem path.
_HUB_ID = re.compile(r"^[A-Za-z0-9][\w.-]*(/[\w.-]+)?$")


class TransformerLoadError(RuntimeError):
    """The transformer model or its calibration file could not be loaded."""


def _read_calibration(path: str) -> Dict[str, Any]:
    if os.path.isdir(path):
        calibration_path = os.path.join(path, CALIBRATION_FILE)
        if not os.path.exists(calibration_path):
            raise TransformerLoadError(
                f"{CALIBRATION_FILE} not found in {path}. It is written next to the weights by "
                "`run_experiment.py --save-model`; an uncalibrated confidence would make the "
                "reliability tiers meaningless."
            )
    elif not _HUB_ID.match(path):
        raise TransformerLoadError(f"Model directory not found: {path}")
    else:  # treated as a Hugging Face hub id
        try:
            from huggingface_hub import hf_hub_download

            calibration_path = hf_hub_download(repo_id=path, filename=CALIBRATION_FILE)
        except Exception as error:
            raise TransformerLoadError(
                f"Could not fetch {CALIBRATION_FILE} for {path!r} from the Hugging Face hub "
                f"({type(error).__name__}). If {path!r} is meant to be a local directory, it does "
                "not exist; if it is a hub id, check the name, network access and HF_TOKEN."
            ) from error

    with open(calibration_path, "r", encoding="utf-8") as handle:
        calibration = json.load(handle)

    temperature = calibration.get("temperature")
    if not isinstance(temperature, (int, float)) or not math.isfinite(temperature) or temperature <= 0:
        raise TransformerLoadError(f"Invalid temperature in {CALIBRATION_FILE}: {temperature!r}")
    if calibration.get("positive_class_index", 1) != 1:
        raise TransformerLoadError("Only models whose positive class is index 1 are supported")
    return calibration


class TransformerClassifier:
    def __init__(
        self,
        model: Any,
        tokenizer: Any,
        temperature: float,
        max_length: int = 256,
        device: Optional[str] = None,
        batch_size: int = 32,
        info: Optional[Dict[str, Any]] = None,
    ) -> None:
        import torch

        self._torch = torch
        self.tokenizer = tokenizer
        self.temperature = float(temperature)
        self.max_length = int(max_length)
        self.batch_size = int(batch_size)
        self.info = info or {}
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model = model.to(self.device).eval()

    @classmethod
    def load(
        cls, path: str, device: Optional[str] = None, batch_size: Optional[int] = None
    ) -> "TransformerClassifier":
        """Load from a local directory or a Hugging Face hub id."""
        try:
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
        except ImportError as error:
            raise TransformerLoadError(
                "Serving the transformer needs torch and transformers "
                "(pip install -r requirements-transformer.txt)"
            ) from error

        calibration = _read_calibration(path)
        try:
            tokenizer = AutoTokenizer.from_pretrained(path)
            model = AutoModelForSequenceClassification.from_pretrained(path)
        except OSError as error:
            raise TransformerLoadError(f"Could not load the model from {path!r}: {error}") from error

        return cls(
            model=model,
            tokenizer=tokenizer,
            temperature=calibration["temperature"],
            max_length=int(calibration.get("max_length", 256)),
            device=device,
            batch_size=batch_size or int(os.getenv("TRANSFORMER_BATCH_SIZE", "32")),
            info={
                "source": path,
                "base_model": calibration.get("base_model"),
                "val_accuracy": calibration.get("val_accuracy"),
                "split_fingerprint": calibration.get("split_fingerprint"),
            },
        )

    def scores(self, texts: Sequence[str]) -> np.ndarray:
        """Uncalibrated log-odds of the positive class, in the input order."""
        if len(texts) == 0:
            return np.empty(0)
        torch = self._torch
        encodings = self.tokenizer(list(texts), truncation=True, max_length=self.max_length)
        # Sort by length so each batch pads as little as possible, then restore the order.
        order = np.argsort([len(ids) for ids in encodings["input_ids"]], kind="stable")

        chunks: List[np.ndarray] = []
        with torch.inference_mode():
            for start in range(0, len(order), self.batch_size):
                indices = order[start : start + self.batch_size]
                batch = self.tokenizer.pad(
                    {
                        "input_ids": [encodings["input_ids"][i] for i in indices],
                        "attention_mask": [encodings["attention_mask"][i] for i in indices],
                    },
                    return_tensors="pt",
                )
                logits = self.model(**{key: value.to(self.device) for key, value in batch.items()}).logits.float()
                chunks.append((logits[:, 1] - logits[:, 0]).cpu().numpy())

        sorted_scores = np.concatenate(chunks).astype(np.float64)
        restored = np.empty_like(sorted_scores)
        restored[order] = sorted_scores
        return restored

    def predict(self, texts: Sequence[str]) -> List[Dict[str, Any]]:
        """Sentiment, calibrated confidence, reliability tier and flags for each text."""
        results: List[Dict[str, Any]] = []
        for score in self.scores(texts):
            positive_probability = 0.5 * (1.0 + math.tanh(0.5 * score / self.temperature))
            confidence = max(positive_probability, 1.0 - positive_probability)
            tier, flags = reliability_tier(confidence)
            results.append(
                {
                    "sentiment": int(score > 0),
                    "confidence": round(float(confidence), 4),
                    "reliability": tier,
                    "flags": flags,
                }
            )
        return results

    def describe(self) -> Dict[str, Any]:
        return {**self.info, "temperature": self.temperature, "max_length": self.max_length}
