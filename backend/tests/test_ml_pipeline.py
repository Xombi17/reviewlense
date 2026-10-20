import os
import pytest
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from backend.ml.train import train_pipeline

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# These tests retrain on the full processed dataset, which is not checked in.
pytestmark = pytest.mark.skipif(
    not os.path.exists(os.path.join(BACKEND_DIR, "data", "processed_train_reviews.csv")),
    reason="processed_train_reviews.csv not found; run ml/build_multidomain_dataset.py first",
)

def test_tfidf_vectorizer():
    """
    R1.2.1: TF-IDF Vectorizer configuration check.
    """
    # This will fail initially as train_pipeline might not return the vectorizer yet
    results = train_pipeline()
    vectorizer = results['vectorizer']
    
    assert isinstance(vectorizer, TfidfVectorizer)
    assert vectorizer.max_features == 20000
    assert vectorizer.ngram_range == (1, 2)
    assert vectorizer.min_df == 2
    assert vectorizer.max_df == 0.95
    assert vectorizer.sublinear_tf is True

def test_model_training_and_serialization():
    """
    R1.3.1, R1.3.2: Classifier training and serialization check.
    """
    results = train_pipeline()
    
    # Check models exist in results
    assert 'sentiment_nb' in results
    assert 'sentiment_lr' in results
    
    # Check serialized files exist
    model_dir = os.path.join(BACKEND_DIR, "models")
    assert os.path.exists(os.path.join(model_dir, "vectorizer.pkl"))
    assert os.path.exists(os.path.join(model_dir, "sentiment_nb.pkl"))
    assert os.path.exists(os.path.join(model_dir, "sentiment_lr.pkl"))

def test_model_evaluation():
    """
    R1.4.1 - R1.4.4: Model evaluation metrics and plots check.
    """
    results = train_pipeline()
    
    # Check metrics exist
    assert 'metrics' in results
    for model_name in ['nb', 'lr']:
        assert model_name in results['metrics']
        m = results['metrics'][model_name]
        assert 'accuracy' in m
        assert 'precision' in m
        assert 'recall' in m
        assert 'f1' in m
        assert 'auc' in m

    # Check plots exist
    plot_dir = os.path.join(PROJECT_ROOT, "notebooks", "plots")
    for model_name in ['nb', 'lr']:
        assert os.path.exists(os.path.join(plot_dir, f"confusion_matrix_{model_name}.png"))
        assert os.path.exists(os.path.join(plot_dir, f"roc_curve_{model_name}.png"))

def test_reliability_metrics_and_failure_analysis():
    """
    R1.5.1 - R1.5.5: Reliability tiers and failure analysis.
    """
    results = train_pipeline()
    
    # Check stats.json
    stats_json_path = os.path.join(BACKEND_DIR, "data", "stats.json")
    assert os.path.exists(stats_json_path)
    stats = pd.read_json(stats_json_path, typ='series')
    assert 'total_reviews' in stats
    assert 'avg_confidence' in stats
    
    # Check failure_analysis.json
    failure_analysis_path = os.path.join(BACKEND_DIR, "data", "failure_analysis.json")
    assert os.path.exists(failure_analysis_path)
    import json
    with open(failure_analysis_path, 'r') as f:
        failures = json.load(f)
    assert isinstance(failures, list)
    assert len(failures) >= 10
    for fail in failures:
        assert 'review_text' in fail
        assert 'true_sentiment' in fail
        assert 'predicted_sentiment' in fail
        assert 'confidence' in fail
        assert 'failure_type' in fail
