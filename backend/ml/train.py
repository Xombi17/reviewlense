import argparse
import os
import joblib
import time
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAIN_DATA_PATH = os.path.join(BASE_DIR, "data", "processed_train_reviews.csv")
TEST_DATA_PATH = os.path.join(BASE_DIR, "data", "processed_test_reviews.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
PLOTS_DIR = os.path.join(os.path.dirname(BASE_DIR), "notebooks", "plots")
STATS_PATH = os.path.join(BASE_DIR, "data", "stats.json")
FAILURE_ANALYSIS_PATH = os.path.join(BASE_DIR, "data", "failure_analysis.json")

def train_pipeline(include_svm: bool = False):
    """
    Executes the full ML training pipeline:
    1. Load train and test datasets
    2. Vectorize text (TF-IDF)
    3. Train classifiers (NB, LR, and optionally Calibrated SVM)
    4. Evaluate and save metrics/plots
    5. Save models and statistics
    """
    print("Starting ML Training Pipeline...")
    
    # Create directories if they don't exist
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(PLOTS_DIR, exist_ok=True)
    
    # 1. Load data
    if not os.path.exists(TRAIN_DATA_PATH) or not os.path.exists(TEST_DATA_PATH):
        raise FileNotFoundError(
            f"Processed data not found. Please run ml/build_multidomain_dataset.py first.\n"
            f"Expected:\n - {TRAIN_DATA_PATH}\n - {TEST_DATA_PATH}"
        )
    
    df_train = pd.read_csv(TRAIN_DATA_PATH)
    df_test = pd.read_csv(TEST_DATA_PATH)
    
    # Ensure label is int
    df_train['label'] = df_train['label'].astype(int)
    df_test['label'] = df_test['label'].astype(int)
    
    X_train_raw = df_train['clean_text']
    y_train = df_train['label']
    X_test_raw = df_test['clean_text']
    y_test = df_test['label']
    
    # 2. Vectorization (R1.2.1)
    print("\n[1/5] Vectorizing text with TF-IDF (float32 for memory efficiency)...")
    vectorizer = TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,
        dtype=np.float32
    )

    print("      Fitting vectorizer on training data...")
    start = time.time()
    X_train = vectorizer.fit_transform(X_train_raw.fillna(''))
    print(f"      ✓ Vectorizer fitted in {time.time() - start:.1f}s | Vocab: {len(vectorizer.vocabulary_):,} | Matrix: {X_train.shape}")

    print("      Transforming test data...")
    start = time.time()
    X_test = vectorizer.transform(X_test_raw.fillna(''))
    print(f"      ✓ Test transformed in {time.time() - start:.1f}s | Matrix: {X_test.shape}")

    # 3. Model Training
    print("\n[2/5] Training Naive Bayes...")
    start = time.time()
    nb_model = MultinomialNB(alpha=1.0)
    nb_model.fit(X_train, y_train)
    print(f"      ✓ NB trained in {time.time() - start:.1f}s")

    print("\n[3/5] Training Logistic Regression (with progress)...")
    start = time.time()
    lr_model = LogisticRegression(max_iter=1000, C=1.0, random_state=42, verbose=1, n_jobs=-1)
    lr_model.fit(X_train, y_train)
    print(f"      ✓ LR trained in {time.time() - start:.1f}s | Iterations: {lr_model.n_iter_[0]}")

    svm_model = None
    if include_svm:
        print("\n[4/5] Training Calibrated Linear SVM (5-fold CV)...")
        start = time.time()
        base_svc = LinearSVC(C=1.0, random_state=42, dual=False)
        svm_model = CalibratedClassifierCV(estimator=base_svc, method='sigmoid', cv=5)
        svm_model.fit(X_train, y_train)
        print(f"      ✓ SVM trained in {time.time() - start:.1f}s")
    else:
        print("\n[4/5] Skipping Calibrated SVM (pass --with-svm to train it)")
    
    # 4. Evaluation (R1.4)
    models = {
        'nb': nb_model,
        'lr': lr_model,
    }
    if svm_model is not None:
        models['svm'] = svm_model

    metrics = {}

    print("\n[4/5] Evaluating models on test set...")
    for name, model in models.items():
        print(f"      Evaluating {name.upper()}...")
        start = time.time()
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1]

        metrics[name] = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred)),
            'recall': float(recall_score(y_test, y_pred)),
            'f1': float(f1_score(y_test, y_pred)),
            'auc': float(roc_auc_score(y_test, y_proba))
        }
        print(f"         ✓ Done in {time.time() - start:.1f}s | AUC: {metrics[name]['auc']:.4f} | F1: {metrics[name]['f1']:.4f}")

        # Plots
        plt.figure(figsize=(8, 6))
        cm = confusion_matrix(y_test, y_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title(f'Confusion Matrix - {name.upper()}')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.savefig(os.path.join(PLOTS_DIR, f'confusion_matrix_{name}.png'))
        plt.close()

        plt.figure(figsize=(8, 6))
        fpr, tpr, _ = roc_curve(y_test, y_proba)
        plt.plot(fpr, tpr, label=f'AUC = {metrics[name]["auc"]:.3f}')
        plt.plot([0, 1], [0, 1], 'k--')
        plt.title(f'ROC Curve - {name.upper()}')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.legend()
        plt.savefig(os.path.join(PLOTS_DIR, f'roc_curve_{name}.png'))
        plt.close()

    # 5. Reliability & Failure Analysis (R1.5)
    # Using LR as default for failure analysis and confidence stats
    print("\n[5/5] Reliability analysis & failure analysis...")
    default_model = lr_model
    y_test_proba = default_model.predict_proba(X_test)
    confidences = np.max(y_test_proba, axis=1)
    y_test_pred = default_model.predict(X_test)

    high_conf = np.sum(confidences >= 0.90) / len(confidences) * 100
    med_conf = np.sum((confidences >= 0.70) & (confidences < 0.90)) / len(confidences) * 100
    low_conf = np.sum(confidences < 0.70) / len(confidences) * 100

    # Failure Analysis
    incorrect_indices = np.where(y_test_pred != y_test)[0]
    failure_data = []

    # Heuristic categorization for 15 examples
    for i in incorrect_indices[:15]:
        review_text = X_test_raw.iloc[i]
        true_val = int(y_test.iloc[i])
        pred_val = int(y_test_pred[i])
        conf = float(confidences[i])

        # Heuristics for failure types
        if len(str(review_text).split()) < 10:
            fail_type = "short_review"
        elif any(w in str(review_text).lower() for w in ["but", "however", "although", "yet"]):
            fail_type = "mixed_sentiment"
        elif any(w in str(review_text).lower() for w in ["not", "no", "never", "hardly", "barely"]):
            fail_type = "negation_failure"
        elif any(w in str(review_text).lower() for w in ["than", "as", "like", "compared"]):
            fail_type = "comparative"
        else:
            fail_type = "sarcasm" # Default fallback

        failure_data.append({
            "review_text": str(review_text),
            "true_sentiment": true_val,
            "predicted_sentiment": pred_val,
            "confidence": conf,
            "failure_type": fail_type
        })

    with open(FAILURE_ANALYSIS_PATH, 'w') as f:
        json.dump(failure_data, f, indent=2)

    # Stats JSON
    stats = {
        "total_reviews": len(df_train) + len(df_test),
        "avg_confidence": float(np.mean(confidences)),
        "dataset_summary": {
            "total_reviews": len(df_train),
            "positive_count": int(np.sum(df_train['label'] == 1)),
            "negative_count": int(np.sum(df_train['label'] == 0)),
            "positive_percentage": float(np.sum(df_train['label'] == 1) / len(df_train) * 100),
            "negative_percentage": float(np.sum(df_train['label'] == 0) / len(df_train) * 100),
            "source": "Amazon Review Polarity Dataset (Local) - 1M balanced subset"
        },
        "models": {
            "lr": {**metrics['lr'], "name": "Logistic Regression", "is_default": True},
            "nb": {**metrics['nb'], "name": "Multinomial Naive Bayes", "is_default": False},
            **(
                {"svm": {**metrics['svm'], "name": "Linear SVM (Calibrated)", "is_default": False}}
                if svm_model is not None
                else {}
            ),
        },
        "reliability_summary": {
            "high_confidence_percentage": float(high_conf),
            "medium_confidence_percentage": float(med_conf),
            "low_confidence_percentage": float(low_conf)
        },
        "failure_modes": {
            "mixed_sentiment": float(sum(1 for f in failure_data if f['failure_type'] == 'mixed_sentiment')),
            "sarcasm": float(sum(1 for f in failure_data if f['failure_type'] == 'sarcasm')),
            "comparative": float(sum(1 for f in failure_data if f['failure_type'] == 'comparative')),
            "short_review": float(sum(1 for f in failure_data if f['failure_type'] == 'short_review')),
            "negation_failure": float(sum(1 for f in failure_data if f['failure_type'] == 'negation_failure'))
        }
    }

    with open(STATS_PATH, 'w') as f:
        json.dump(stats, f, indent=2)

    # 6. Serialization (R1.3.2)
    print("\n[6/6] Saving models...")
    start = time.time()
    joblib.dump(vectorizer, os.path.join(MODELS_DIR, 'vectorizer.pkl'))
    joblib.dump(nb_model, os.path.join(MODELS_DIR, 'sentiment_nb.pkl'))
    joblib.dump(lr_model, os.path.join(MODELS_DIR, 'sentiment_lr.pkl'))
    if svm_model is not None:
        joblib.dump(svm_model, os.path.join(MODELS_DIR, 'sentiment_svm.pkl'))
    print(f"      ✓ Models saved in {time.time() - start:.1f}s")

    print("\n" + "="*60)
    print(" 🎉 TRAINING PIPELINE COMPLETE")
    print("="*60)
    print(f" 📊 Logistic Regression:  AUC={metrics['lr']['auc']:.4f}  F1={metrics['lr']['f1']:.4f}")
    print(f" 📊 Naive Bayes:          AUC={metrics['nb']['auc']:.4f}  F1={metrics['nb']['f1']:.4f}")
    print(f" 💾 Models saved to:      {MODELS_DIR}")
    print(f" 📈 Plots saved to:       {PLOTS_DIR}")
    print(f" 📋 Stats saved to:       {STATS_PATH}")
    print("="*60 + "\n")

    results = {
        'vectorizer': vectorizer,
        'sentiment_nb': nb_model,
        'sentiment_lr': lr_model,
        'metrics': metrics
    }
    if svm_model is not None:
        results['sentiment_svm'] = svm_model
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ReviewLens sentiment models")
    parser.add_argument(
        "--with-svm",
        action="store_true",
        help="Also train the calibrated linear SVM (slow on large datasets)",
    )
    train_pipeline(include_svm=parser.parse_args().with_svm)
