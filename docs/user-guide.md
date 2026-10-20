# ReviewLens AI - End-User Guide

ReviewLens AI provides a rich, responsive dashboard to help you analyze product reviews. This guide walks you through navigating the web application and understanding the generated sentiment, aspect, and trust insights.

---

## 🚀 Accessing the Application

By default, the web interface is accessible locally.
1. Open your web browser.
2. Navigate to **[http://localhost:3000](http://localhost:3000)**.
3. You will see the **ReviewLens Dashboard**, which is divided into **Single Review Analysis** and **Batch Upload** views.

---

## 🧪 Single Review Analysis

The Single Review Analysis section allows you to test individual review texts interactively.

### Steps to Analyze a Review:
1. Locate the text area under **Analyze a Review**.
2. Type or paste your product review.
3. Choose a machine learning classifier from the **Select Model** dropdown:
   - **Logistic Regression** (Default, well-balanced)
   - **Naive Bayes** (Fast, baseline classifier)
4. Click the **Analyze** button.

---

## 📊 Understanding Your Results

Once analyzed, the dashboard displays three distinct classes of insights:

### 1. Overall Sentiment & Reliability
* **Sentiment Class**: The predicted overall polarity.
  - **Positive**: The review conveys a generally positive opinion.
  - **Negative**: The review conveys a generally negative opinion.
* **Confidence**: A probability score between `0.5` and `1.0` representing the model's confidence in its sentiment prediction.
* **Reliability Tier**:
  - `HIGH`: Confidence $\ge 90\%$. The prediction is extremely reliable.
  - `MEDIUM`: Confidence $\ge 70\%$ and $< 90\%$. The prediction is reasonably reliable.
  - `LOW`: Confidence $< 70\%$. This will also trigger an `uncertain_prediction` warning flag indicating that you should read the review manually.

### 2. Aspect-Based Sentiments
The system extracts mentions of specific product categories and calculates sentiment for each sentence where those aspects are mentioned.
The 8 tracked aspects are:
* **battery** (keywords: *battery, charge, power, runtime*)
* **sound** (keywords: *sound, audio, bass, treble, volume*)
* **build** (keywords: *build, quality, durability, plastic, metal*)
* **comfort** (keywords: *comfort, fit, wear, ergonomics, pain*)
* **connectivity** (keywords: *bluetooth, wireless, pairing, connect, signal*)
* **delivery** (keywords: *shipping, delivery, arrived, package*)
* **price** (keywords: *price, cost, value, expensive, cheap*)
* **mic** (keywords: *mic, microphone, call, voice*)

If an aspect is found, it will be labeled positive (green) or negative (red) on the aspect cards.

### 3. Review Trust Score & Flags
The Trust Analyzer detects automated, spam, or shouting reviews by deducting points from a base score of `1.0`:
* **Length Penalty (-0.3)**: Applied if the review text is extremely brief (less than 20 characters). Flags: `very_short_review`.
* **Capitalization Penalty (-0.2)**: Applied if the review is written completely in ALL-CAPS (shouting).
* **Exclamation Penalty (-0.1)**: Applied if the review has more than 3 exclamation marks (`!`).
* **Repetition Penalty (-0.15)**: Applied if any non-trivial word is repeated more than 3 times in the text.
* **Suspicious Flag**: If the final trust score drops below `0.5`, the review is flagged with `suspicious_review`.

---

## 📂 Batch CSV Processing

To analyze a large list of reviews at once:
1. Navigate to the **Batch Upload** tab in the UI.
2. Select or drag-and-drop a CSV file.
   > [!IMPORTANT]
   > The uploaded CSV must contain a column named exactly `reviewText` containing the text of the reviews.
3. Click **Upload & Process**.
4. The dashboard will populate with:
   - A Recharts visualization of the Positive vs. Negative sentiment distribution.
   - Aggregate metrics such as average prediction confidence and the count of suspicious reviews.
   - A breakdown of the reliability tiers (`HIGH`, `MEDIUM`, `LOW`).
   - Bulleted tables showing the top complaints (highest-confidence negative reviews) and top praised items (highest-confidence positive reviews).

---

## 💡 Real-World Examples

Here is how different reviews are processed by the system:

| Review Input | Sentiment Result | Aspects Extracted | Trust Score | Flags Triggered |
| :--- | :--- | :--- | :--- | :--- |
| *"The battery life is amazing, but the bluetooth drops connection constantly!"* | **Positive** (Confidence: 0.82, `MEDIUM`) | `battery` (positive), `connectivity` (negative) | `1.0` | None |
| *"GREAT SOUND! COMFORTABLE FIT!"* | **Positive** (Confidence: 0.94, `HIGH`) | `sound` (positive), `comfort` (positive) | `0.8` | None (shouting penalty of -0.2 applied) |
| *"cheap plastic crap. mic broke immediately."* | **Negative** (Confidence: 0.98, `HIGH`) | `price` (negative), `build` (negative), `mic` (negative) | `1.0` | None |
| *"AWESOME!!!!"* | **Positive** (Confidence: 0.55, `LOW`) | None | `0.4` | `very_short_review`, `suspicious_review`, `uncertain_prediction` |
