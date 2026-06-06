import os
import pytest
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from backend.ml.train import train_pipeline

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
    assert 'sentiment_svm' in results
    
    # Check serialized files exist
    model_dir = "backend/models/"
    assert os.path.exists(os.path.join(model_dir, "vectorizer.pkl"))
    assert os.path.exists(os.path.join(model_dir, "sentiment_nb.pkl"))
    assert os.path.exists(os.path.join(model_dir, "sentiment_lr.pkl"))
    assert os.path.exists(os.path.join(model_dir, "sentiment_svm.pkl"))

def test_model_evaluation():
    """
    R1.4.1 - R1.4.4: Model evaluation metrics and plots check.
    """
    results = train_pipeline()
    
    # Check metrics exist
    assert 'metrics' in results
    for model_name in ['nb', 'lr', 'svm']:
        assert model_name in results['metrics']
        m = results['metrics'][model_name]
        assert 'accuracy' in m
        assert 'precision' in m
        assert 'recall' in m
        assert 'f1' in m
        assert 'auc' in m

    # Check plots exist
    plot_dir = "notebooks/plots/"
    for model_name in ['nb', 'lr', 'svm']:
        assert os.path.exists(os.path.join(plot_dir, f"confusion_matrix_{model_name}.png"))
        assert os.path.exists(os.path.join(plot_dir, f"roc_curve_{model_name}.png"))

def test_reliability_metrics_and_failure_analysis():
    """
    R1.5.1 - R1.5.5: Reliability tiers and failure analysis.
    """
    results = train_pipeline()
    
    # Check stats.json
    assert os.path.exists("backend/data/stats.json")
    stats = pd.read_json("backend/data/stats.json", typ='series')
    assert 'total_reviews' in stats
    assert 'avg_confidence' in stats
    
    # Check failure_analysis.json
    assert os.path.exists("backend/data/failure_analysis.json")
    import json
    with open("backend/data/failure_analysis.json", 'r') as f:
        failures = json.load(f)
    assert isinstance(failures, list)
    assert len(failures) >= 10
    for fail in failures:
        assert 'review_text' in fail
        assert 'true_sentiment' in fail
        assert 'predicted_sentiment' in fail
        assert 'confidence' in fail
        assert 'failure_type' in fail
