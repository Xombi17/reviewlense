# ReviewLens AI

ReviewLens AI is a full-stack web application designed for sentiment analysis and aspect-based review insight extraction from product reviews. Built as an end-to-end system, it integrates a machine learning pipeline (featuring Naive Bayes, Logistic Regression, and SVM classifiers) with a FastAPI backend and a responsive Next.js 16 frontend. The application focuses on model reliability, uncertainty flagging, aspect extraction, and review trust analysis, making it an excellent tool for understanding customer feedback in depth.

---

## 🛠️ Tech Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend** | FastAPI | `0.111.0` | High-performance asynchronous REST API |
| **Backend Server** | Uvicorn | `0.29.0` | ASGI server implementation |
| **Machine Learning** | scikit-learn | `1.5.0` | ML modeling (Naive Bayes, LR, SVM) |
| **Data Processing** | pandas | `2.2.2` | Data manipulation and preprocessing |
| **Data Processing** | numpy | `1.26.4` | Numerical array operations |
| **NLP** | NLTK | `3.8.1` | Tokenization, stopwords, lemmatization |
| **Frontend** | Next.js (App Router) | `16.x` | Modern React framework |
| **Styling** | Tailwind CSS | `v3` | Utility-first CSS styling |
| **Visualizations** | Recharts | `Latest` | Interactive data charts and graphs |

---

## 📋 Prerequisites

To run this project locally, ensure you have the following installed:
- **Python**: version `3.10` or higher
- **Node.js**: version `18` or higher
- **NPM**: package manager (typically bundled with Node.js)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mini-project1
```

### 2. Backend Setup & Run

Create a virtual environment, install the required packages, and start the development server:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
# .\venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --port 8000
```
The FastAPI documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Setup & Run

Navigate to the frontend directory, install dependencies, and run the Next.js development server:

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Next.js development server
npm run dev
```
The frontend application will be running at [http://localhost:3000](http://localhost:3000).

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | API Root / Welcome check |
| **POST** | `/predict` | Analyzes a single review text for sentiment, confidence, reliability, aspects, and trust. |
| **POST** | `/batch` | Uploads a CSV of reviews and returns aggregated metrics, distribution, and top complaints. |
| **GET** | `/stats` | Retrieves dataset metadata and evaluation metrics for all trained models. |

---

## 📁 Directory Structure

```text
.
├── backend/
│   ├── main.py              # Application entrypoint & CORS configuration
│   ├── requirements.txt     # Python pinned dependencies
│   ├── routes/              # FastAPI router modules (predict, batch, stats)
│   ├── ml/                  # ML modules (preprocessing, loader, predictor, aspects, trust)
│   ├── schemas/             # Pydantic request/response validation schemas
│   ├── models/              # Serialized model pickle files (*.pkl) (gitignored)
│   └── data/
│       └── raw/             # Raw Kaggle review CSV datasets (gitignored)
├── frontend/
│   ├── app/                 # Next.js pages, routing, and layout
│   ├── components/          # Reusable React UI components
│   ├── lib/                 # Shared API client and TS interface definitions
│   └── public/              # Static public assets
├── notebooks/
│   ├── EDA.ipynb            # Exploratory Data Analysis & cleaning notebook
│   └── Training.ipynb       # Model training, validation, & metric export notebook
├── .gitignore               # Root git ignore patterns
└── README.md                # Project documentation
```
