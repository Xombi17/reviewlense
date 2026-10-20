# ReviewLens AI - Developer Guide

This guide describes how to set up the ReviewLens AI codebase locally, run the development servers, and work with the underlying machine learning pipeline.

---

## 📋 Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `18` or higher
- **NPM**: package manager (typically bundled with Node.js)

---

## 🚀 Local Installation & Run

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mini-project1
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Initialize and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```
3. Install the required python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   PYTHONPATH=. uvicorn main:app --reload --port 8000
   ```
The FastAPI ASGI server starts running at **[http://localhost:8000](http://localhost:8000)**. Access the interactive API Swagger UI at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

### 3. Frontend Setup
1. In a new terminal tab, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend Node.js packages:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
The frontend starts running on **[http://localhost:3000](http://localhost:3000)**.

---

## 🧠 Machine Learning Pipeline

### 📊 Dataset Details
* **Source**: Hugging Face `McAuley-Lab/Amazon-Reviews-2023`.
* **Total Reviews**: 19,418.
* **Distribution Skew**: 17,554 positive reviews (90.4%) and 1,864 negative reviews (9.6%).
* **Split Strategy**: Stratified 80/20 train/test split. Stratification is crucial here because of the skewed class distribution, ensuring that both training and testing sets maintain the same proportion of classes.

### 🧹 Text Preprocessing Steps
The text is preprocessed in [backend/ml/preprocessing.py](file:///home/varad/Documents/himshikhar/mini-project1/backend/ml/preprocessing.py) before classification:
1. **Lowercase**: Converts the text to lowercase.
2. **Regex Cleaning**: Strips HTML tags, URLs, and all special characters except apostrophes and spaces.
3. **Contraction Expansion**: Uses the `contractions` library to expand abbreviations (e.g. *can't* $\to$ *cannot*).
4. **Tokenization**: Uses NLTK `word_tokenize`.
5. **Negation-Aware Stopwords**: Filters out standard English stopwords, but explicitly **retains negation markers** (`not`, `no`, `never`, `hardly`, `barely`). This preserves the sentiment valence of sentences like *"not good"*.
6. **Lemmatization**: Uses NLTK `WordNetLemmatizer` to normalize words to their base form.

### ⚙️ TF-IDF Vectorization
* **Vectorizer**: `TfidfVectorizer` (scikit-learn).
* **Configuration**:
  - Max features: `20,000`.
  - N-grams: Unigrams and bigrams (`ngram_range=(1, 2)`).
  - Minimum document frequency (`min_df`): `2`.
  - Maximum document frequency (`max_df`): `0.95`.
  - Logarithmic scaling (`sublinear_tf`): `True`.

---

## 🚂 Model Training & Evaluation

### Models Trained:
1. **Logistic Regression (`lr`)** — Default classifier.
2. **Multinomial Naive Bayes (`nb`)** — Baseline classifier.

An optional **Calibrated SVM** (`LinearSVC` wrapped in `CalibratedClassifierCV`) can be trained with `python ml/train.py --with-svm`. It is not shipped or served by default; train it against the current vectorizer and check its metrics before enabling it.

### Model Metrics (Test Split):

| Model | Accuracy | Precision | Recall | F1-Score | AUC |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression (`lr`)** | `92.09%` | `92.02%` | `92.15%` | `92.09%` | `0.9752` |
| **Naive Bayes (`nb`)** | `87.84%` | `89.05%` | `86.28%` | `87.64%` | `0.9503` |

### 🛠️ How to Retrain Models
To run the training pipeline, regenerate model metrics, recreate confusion matrix/ROC plots, and save serialized `.pkl` models:
```bash
# Navigate to backend directory and activate your virtual environment
cd backend
source .venv/bin/activate

# Execute the training pipeline script
PYTHONPATH=. python ml/train.py
```
This script will overwrite the models in `backend/models/`, save updated statistics to `backend/data/stats.json`, and write plots to `notebooks/plots/`.

---

## 📉 Failure Analysis
Based on the default Logistic Regression model on the test split, the pipeline classifies errors into 5 main failure modes:
1. **Negation Failures**: Handling complex negated structures (e.g. *"not a single bad thing to say"* misclassified as negative).
2. **Mixed Sentiment**: When a review contains a balanced mix of praises and complaints, making it difficult for standard bag-of-words/TF-IDF models to resolve the overall polarity.
3. **Sarcasm**: Sarcastic remarks containing highly positive words but carrying negative intent (e.g. *"Wow, wonderful product that broke in 5 minutes!"*).
4. **Short Reviews**: Insufficient text length, where very few words are available to calculate TF-IDF features.
5. **Comparative Language**: Comparisons to other products where the mentioned features belong to a competitor (e.g. *"Much better sound than the Bose, but build quality is lower"*).
