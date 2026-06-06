import os
from typing import Any, Dict

import joblib


class ModelLoader:
    def __init__(self, models_dir: str = "backend/models"):
        self.models_dir = models_dir
        self.models: Dict[str, Any] = {}
        self.vectorizer = None

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

    def get_model(self, model_name: str):
        return self.models.get(model_name)
