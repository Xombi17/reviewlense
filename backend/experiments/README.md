# Model comparison experiments

Reproducible comparison of the TF-IDF classifiers used by the API against a fine-tuned
transformer, with the evaluation the API's "reliability" claims depend on: calibration,
selective prediction (abstaining on low confidence) and significance testing.

Nothing here is imported by the serving API.

## Design

- **One interface.** Every model is reduced to log-odds of the positive class, so metrics and
  calibration code are shared and the comparison is like for like.
- **Shared, deduplicated splits.** Duplicate review bodies are dropped, then the data is split
  stratified 80/10/10 with a fixed seed. A hash of the split contents is stored with every run;
  `--merge` refuses to combine runs whose splits differ.
- **No test-set tuning.** Hyperparameters (LR `C`, NB `alpha`, best transformer epoch) and the
  calibration temperature are chosen on the validation split. The test split is scored once.
- **Uncertainty reported.** 95% bootstrap intervals on accuracy, AUC and ECE; paired bootstrap
  and exact McNemar tests for model-vs-model differences.

## What the report measures

| Section | Why it matters |
| :-- | :-- |
| Accuracy, F1, AUC, NLL, Brier | Discrimination and probability quality |
| ECE before / after temperature scaling | Whether "confidence" can be read as a probability |
| Selective prediction (accuracy at 100/90/80/70/50% coverage, AURC) | Whether low confidence actually flags errors |
| Reliability tiers (HIGH >= 0.90, MEDIUM >= 0.70, LOW) | Whether the API's fixed thresholds mean what they say |
| Cost (parameters, train time, ms per review) | The price of any accuracy gain |

Temperature scaling is monotonic, so it changes calibration and tier membership but never the
confidence ranking; selective-prediction numbers are the same before and after.

## Running it

From `backend/`:

```bash
pip install -r requirements-experiments.txt

# Classical baselines on the 20k reviews in test_csvs/ (about 20 seconds on a laptop)
python -m experiments.run_experiment --data local --out experiments/results/local-tfidf

# Ablation: production NLTK cleaning vs raw text, merged into the same report
python -m experiments.run_experiment --data local --models tfidf-lr tfidf-nb \
    --preprocess clean --tag clean --merge --out experiments/results/local-tfidf

# Fine-tune a transformer on the same splits and add it to that report.
# Needs huggingface.co access to download the pretrained weights; a GPU is strongly recommended.
python -m experiments.run_experiment --data local --models transformer \
    --model-name distilroberta-base --epochs 2 --merge --out experiments/results/local-tfidf

# Larger run on Amazon polarity from the Hugging Face hub
python -m experiments.run_experiment --data hf --n-total 200000 \
    --models tfidf-lr tfidf-nb transformer --out experiments/results/hf-200k
```

Every run writes `report.md`, `results.json`, `predictions.npz`, `meta.json`, `reliability.png`
and `risk_coverage.png`. `predictions.npz` holds the raw log-odds, so a run trained on a GPU
machine can be copied back and re-analysed with
`python -m experiments.report --run-dir experiments/results/<run>`.

### On Google Colab

Use a T4 runtime, clone the repo, `pip install -r backend/requirements-experiments.txt`, run the
`hf` command above from `backend/`, then download the run directory.

## Tests

`pytest` covers the metrics against known values (including recovering a known temperature), split
determinism and leakage, the TF-IDF baselines, and the fine-tuning loop. The loop is tested on a
tiny randomly initialised BERT (`tiny_model.py`) that needs no network; those tests are skipped
when `torch` is not installed. That tiny model proves the code runs and learns a toy task. It says
nothing about real transformer quality.

## Status and limitations

- `results/local-tfidf` holds real results for the classical baselines on a **20k-review
  development subset**. It is for validating the pipeline, not for headline claims.
- **No fine-tuned transformer result exists yet.** The environment this was built in could not
  reach huggingface.co, so the transformer path is tested only on the tiny offline model and the
  `--data hf` path has not been run.
- Binary labels only (Amazon polarity drops 3-star reviews); a neutral class is future work.
- One training seed per model. Differences smaller than seed-to-seed variance are not detectable.
- Pairwise p-values are not corrected for multiple comparisons.
