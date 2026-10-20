import os
from typing import Any, Dict, List, Optional

import joblib


class ModelLoader:
    def __init__(self, models_dir: str = "backend/models"):
        self.models_dir = models_dir
        self.models: Dict[str, Any] = {}
        self.vectorizer = None
        self.transformer = None  # optional fine-tuned model; see load_transformer

    def load_all_models(self):
        """Load vectorizer.pkl and sentiment_lr.pkl/nb.pkl/svm.pkl from models_dir."""
        if not os.path.isdir(self.models_dir):
            raise FileNotFoundError(f"Models directory not found: {self.models_dir}")

        vectorizer_path = os.path.join(self.models_dir, "vectorizer.pkl")
        if not os.path.exists(vectorizer_path):
            raise FileNotFoundError(f"Vectorizer not found: {vectorizer_path}")

        self.vectorizer = joblib.load(vectorizer_path)
        self.models = {}

        for filename in os.listdir(self.models_dir):
            if filename.startswith("sentiment_") and filename.endswith(".pkl"):
                model_name = filename.replace("sentiment_", "").replace(".pkl", "")
                model_path = os.path.join(self.models_dir, filename)
                self.models[model_name] = joblib.load(model_path)

        if not self.models:
            raise RuntimeError(f"No sentiment models found in {self.models_dir}")

        self.load_transformer()

    def load_transformer(self, path: Optional[str] = None) -> None:
        """Load the fine-tuned transformer from ``path`` or the TRANSFORMER_MODEL env var.

        ``path`` is a local directory written by ``run_experiment.py --save-model`` or a Hugging
        Face hub id. Nothing happens when neither is given. A configured but unloadable model
        raises, so a typo in the path fails at startup instead of silently serving only TF-IDF.
        """
        path = path or os.getenv("TRANSFORMER_MODEL")
        if not path:
            return
        from .transformer_classifier import TransformerClassifier

        self.transformer = TransformerClassifier.load(path, device=os.getenv("TRANSFORMER_DEVICE") or None)

    def available_models(self) -> List[str]:
        """Model ids the API can serve, TF-IDF models first."""
        names = sorted(self.models)  # directory-listing order is arbitrary; keep the output stable
        if self.transformer is not None:
            names.append("transformer")
        return names

    def get_model(self, model_name: str):
        return self.models.get(model_name)
