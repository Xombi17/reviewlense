# ReviewLens AI - Demo Video Scripts

This document contains written, time-coded, and speaker-prompted scripts for recording a demo video of ReviewLens AI.

---

## Part 1: End-User Walkthrough Script
* **Target Duration**: 3 - 5 minutes
* **Audience**: End-users, product managers, and reviewers

| Time | Visual / UI Action Cue | Speaker Voiceover Text |
| :--- | :--- | :--- |
| **0:00 - 0:30** | Show the browser screen on `http://localhost:3000`. Hover over the clean, modern glassmorphism UI header. | "Hello and welcome to the ReviewLens AI demo! ReviewLens AI is an advanced sentiment analysis and aspect extraction tool designed to help businesses and developers understand customer feedback in depth. Today, we'll walk through its capabilities from both a user and developer standpoint." |
| **0:30 - 1:15** | Scroll down to the Single Review Text Area. Type: *"The sound quality is absolutely crisp and the battery lasts all day! However, the Bluetooth pairing can be a bit slow, and it fits too tight on my head."* Select **Logistic Regression** and click **Analyze**. | "Let's start with a single review. I'm pasting a review that has mixed feedback—praising sound and battery, but complaining about comfort and connectivity. By clicking Analyze, our FastAPI ML backend instantly processes the text." |
| **1:15 - 2:00** | Point the cursor to the Sentiment Label (**Positive**), the Confidence gauge (**0.92**), and the Aspect Sentiment Breakdown list. Highlight how `battery` and `sound` are marked green (positive) and `comfort` and `connectivity` are marked red (negative). | "As you can see, the overall sentiment is classified as Positive with high confidence. Below, the aspect extractor broke down specific components. The battery and sound aspects are marked positive, while comfort and connectivity are flagged as negative. This aspect-level breakdown gives precise insights without reading the entire text manually." |
| **2:00 - 2:45** | Type: *"CRAP PRODUCT!!! WORST THING EVER!!!"* Click **Analyze**. Highlight the Trust Score dropping to **0.5** and the `very_short_review` and `suspicious_review` flags. | "Now, let's look at the Trust Score. If someone posts spam or shouty reviews, our trust analyzer applies penalties. Here, using all-caps and multiple exclamation marks triggers capitalization and exclamation penalties, dropping the trust score and flagging it as suspicious." |
| **2:45 - 3:45** | Click on the **Batch Upload** tab. Drag-and-drop a sample review CSV, and click **Process**. Show the Recharts pie chart of positive/negative sentiment distribution and the tables of top complaints and praised items. | "For bulk reviews, the Batch Upload tab allows processing entire CSVs. Uploading a file gives us an instant dashboard summary: overall sentiment breakdown, average prediction confidence, reliability distribution, and automated compilation of top customer praises and complaints." |
| **3:45 - 4:00** | Return to the home screen dashboard. | "That concludes the user walkthrough. Next, let's look at how developers can set up and run this project locally in minutes." |

---

## Part 2: Developer Setup Script
* **Target Duration**: 4 - 6 minutes
* **Audience**: Developers, contributors, and systems engineers

| Time | Visual / Terminal Action Cue | Speaker Voiceover Text |
| :--- | :--- | :--- |
| **0:00 - 0:30** | Show a clean bash terminal. Show the repository URL. | "Welcome to the developer setup guide for ReviewLens AI. We will go through setting up the FastAPI backend, installing Next.js dependencies, testing the REST API, and running the model training pipeline." |
| **0:30 - 1:45** | Run `git clone <repo>` and `cd mini-project1`. Create a virtual environment using `python -m venv .venv`. Activate it and run `pip install -r requirements.txt` in the `backend/` directory. | "First, we clone the repository and navigate into the `backend` directory. We initialize a clean Python virtual environment, activate it, and install all required dependencies—including scikit-learn, FastAPI, and NLTK for preprocessing." |
| **1:45 - 2:45** | Run `PYTHONPATH=. uvicorn main:app --reload --port 8000`. Open a browser to `http://localhost:8000/docs`. | "With dependencies installed, we launch the FastAPI ASGI server using Uvicorn. The server runs on port 8000. Navigating to `/docs` opens the interactive Swagger UI, where we can test our endpoints." |
| **2:45 - 3:45** | Expand the `/predict` post route in Swagger. Click **Try it out**, paste a review, and execute. Show the JSON response. | "Using Swagger, we can test the `/predict` endpoint. We input a JSON payload with a review text, hit execute, and verify the structured JSON response containing sentiment labels, aspect classifications, and the calculated trust score." |
| **3:45 - 4:45** | Open a new terminal tab. Navigate to `frontend/`. Run `npm install` followed by `npm run dev`. Open `http://localhost:3000`. | "Now for the frontend. We switch to the `frontend/` folder, run `npm install` to set up Next.js 16 and Recharts dependencies, and then run `npm run dev` to start the Next.js dev server on port 3000." |
| **4:45 - 5:30** | Open `backend/ml/train.py` in the IDE. Run `python ml/train.py`. | "If you want to retrain the models or use a different dataset, we simply run the training script. This script splits the data, runs the TF-IDF vectorizer, trains our three classifiers, saves metrics to `stats.json`, and updates the serialized models." |
| **5:30 - 6:00** | Show the running frontend and backend together. | "And that's it! You now have a fully functional machine learning application running locally. You're ready to start building and customizing ReviewLens AI. Thanks for watching!" |
