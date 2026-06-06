import os
import joblib
from typing import Dict, Any

class ModelLoader:
    def __init__(self, models_dir: str = "backend/models"):
        self.models_dir = models_dir
        self.models: Dict[str, Any] = {}
        self.vectorizer = None

    def load_all_models(self):
        """
        Loads all persisted models (LR, NB, SVM) and the vectorizer.
        """
        pass

    def get_model(self, model_name: str):
        return self.models.get(model_name)
