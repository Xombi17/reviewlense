# Model comparison: hf data

Splits: train 159,980 / val 19,998 / test 19,998 (seed 42, fingerprint `5e9d4ef3679e`). Hyperparameters and the calibration temperature are fitted on validation only; all numbers below are on the held-out test split. Brackets are 95% bootstrap intervals.

> 200k-review Amazon polarity sample from the Hugging Face hub.

## Accuracy and calibration

| Model | Accuracy | F1 | AUC | NLL | Brier | ECE (raw) | ECE (scaled) | T |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| tfidf-lr | 0.9253 [0.9217, 0.9289] | 0.9251 | 0.9769 [0.9752, 0.9787] | 0.1976 | 0.0570 | 0.0217 [0.0189, 0.0249] | 0.0057 | 0.83 |
| tfidf-nb | 0.8921 [0.8881, 0.8962] | 0.8912 | 0.9585 [0.9562, 0.9610] | 0.2726 | 0.0805 | 0.0405 [0.0375, 0.0446] | 0.0100 | 0.75 |
| transformer-distilroberta-base | 0.9611 [0.9584, 0.9637] | 0.9610 | 0.9915 [0.9905, 0.9925] | 0.1374 | 0.0327 | 0.0252 [0.0231, 0.0278] | 0.0119 | 1.48 |
| transformer-distilroberta-base+saved | 0.9619 [0.9593, 0.9643] | 0.9617 | 0.9915 [0.9905, 0.9925] | 0.1387 | 0.0330 | 0.0249 [0.0229, 0.0278] | 0.0117 | 1.48 |

ECE is the expected calibration error over 10 equal-width confidence bins (lower is better). T is the temperature fitted on validation; T > 1 means the raw model was overconfident.

> **tfidf-nb** picked 0.01 at the edge of its search grid (0.01 to 1.0), so a better value may lie outside it and this baseline may be slightly under-tuned.

## Cost

| Model | Parameters | Train (s) | Test inference (s) | ms / review | Hardware |
| :-- | :-- | :-- | :-- | :-- | :-- |
| tfidf-lr | n/a | 42 | 2.4 | 0.12 | x86_64, 2 CPU threads, CPU only |
| tfidf-nb | n/a | 36 | 2.4 | 0.12 | x86_64, 2 CPU threads, CPU only |
| transformer-distilroberta-base | 82,119,938 | 1936 | 66.0 | 3.30 | x86_64, 2 CPU threads, GPU Tesla T4 |
| transformer-distilroberta-base+saved | 82,119,938 | 1932 | 65.8 | 3.29 | x86_64, 2 CPU threads, GPU Tesla T4 |

Timings are wall-clock on the hardware shown, so they are only comparable between rows run on the same machine.

## Selective prediction (abstain on the least confident)

| Model | acc @ 100% | acc @ 90% | acc @ 80% | acc @ 70% | acc @ 50% | AURC |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| tfidf-lr | 92.53% | 95.79% | 97.56% | 98.52% | 99.25% | 0.0149 |
| tfidf-nb | 89.21% | 92.88% | 95.17% | 96.69% | 98.31% | 0.0284 |
| transformer-distilroberta-base | 96.11% | 98.56% | 99.19% | 99.46% | 99.52% | 0.0062 |
| transformer-distilroberta-base+saved | 96.19% | 98.59% | 99.23% | 99.46% | 99.49% | 0.0062 |

Temperature scaling is monotonic, so it cannot change which predictions rank as most confident; this table is identical before and after calibration. AURC is the area under the risk-coverage curve (lower is better).

![Risk-coverage](risk_coverage.png)

## Do the API's reliability tiers mean something?

The API labels predictions HIGH (confidence >= 0.90), MEDIUM (>= 0.70) and LOW. Share of test reviews and accuracy inside each tier:

| Model | Calibration | HIGH share / acc | MEDIUM share / acc | LOW share / acc |
| :-- | :-- | :-- | :-- | :-- |
| tfidf-lr | raw | 68.9% / 98.6% | 20.6% / 86.9% | 10.5% / 63.9% |
| tfidf-lr | scaled | 75.1% / 98.1% | 16.1% / 83.2% | 8.8% / 61.9% |
| tfidf-nb | raw | 51.1% / 98.3% | 31.1% / 89.1% | 17.8% / 63.3% |
| tfidf-nb | scaled | 64.1% / 97.3% | 22.7% / 83.3% | 13.1% / 59.8% |
| transformer-distilroberta-base | raw | 96.5% / 97.4% | 2.3% / 65.4% | 1.2% / 50.6% |
| transformer-distilroberta-base | scaled | 94.1% / 98.0% | 4.1% / 71.4% | 1.8% / 53.1% |
| transformer-distilroberta-base+saved | raw | 96.5% / 97.4% | 2.4% / 65.3% | 1.1% / 60.6% |
| transformer-distilroberta-base+saved | scaled | 94.1% / 98.0% | 4.1% / 70.1% | 1.8% / 61.5% |

![Reliability diagrams](reliability.png)

## Pairwise comparison

Accuracy(A) - Accuracy(B) with a paired bootstrap interval, and an exact McNemar test on the reviews where exactly one model is right.

| A | B | Delta accuracy | only A right | only B right | McNemar p |
| :-- | :-- | :-- | :-- | :-- | :-- |
| tfidf-lr | tfidf-nb | 0.0332 [0.0294, 0.0369] | 1157 | 493 | 1.484e-61 |
| tfidf-lr | transformer-distilroberta-base | -0.0358 [-0.0393, -0.0324] | 296 | 1012 | 7.986e-92 |
| tfidf-lr | transformer-distilroberta-base+saved | -0.0366 [-0.0400, -0.0330] | 286 | 1017 | 2.721e-96 |
| tfidf-nb | transformer-distilroberta-base | -0.0690 [-0.0731, -0.0646] | 313 | 1693 | 1.471e-228 |
| tfidf-nb | transformer-distilroberta-base+saved | -0.0698 [-0.0737, -0.0655] | 301 | 1696 | 2.119e-235 |
| transformer-distilroberta-base | transformer-distilroberta-base+saved | -0.0008 [-0.0017, 0.0002] | 43 | 58 | 0.1633 |

## Setup

```json
{
  "tfidf-lr": {
    "preprocess": "raw",
    "max_features": 100000,
    "C": 4.0,
    "grid": [
      0.25,
      0.5,
      1.0,
      2.0,
      4.0,
      8.0,
      32.0
    ],
    "at_grid_edge": false,
    "val_accuracy_at_selection": 0.9256925692569257
  },
  "tfidf-nb": {
    "preprocess": "raw",
    "max_features": 100000,
    "alpha": 0.01,
    "grid": [
      0.01,
      0.03,
      0.1,
      0.3,
      1.0
    ],
    "at_grid_edge": true,
    "val_accuracy_at_selection": 0.8943394339433943
  },
  "transformer-distilroberta-base": {
    "model_name": "distilroberta-base",
    "max_length": 256,
    "batch_size": 32,
    "eval_batch_size": 128,
    "learning_rate": 2e-05,
    "epochs": 2,
    "warmup_ratio": 0.06,
    "weight_decay": 0.01,
    "max_grad_norm": 1.0,
    "seed": 42,
    "max_train_samples": null,
    "device": "cuda",
    "log_every": 100,
    "best_epoch": 2,
    "n_parameters": 82119938,
    "n_train_used": 159980
  },
  "transformer-distilroberta-base+saved": {
    "model_name": "distilroberta-base",
    "max_length": 256,
    "batch_size": 32,
    "eval_batch_size": 128,
    "learning_rate": 2e-05,
    "epochs": 2,
    "warmup_ratio": 0.06,
    "weight_decay": 0.01,
    "max_grad_norm": 1.0,
    "seed": 42,
    "max_train_samples": null,
    "device": "cuda",
    "log_every": 100,
    "train_seed": 42,
    "best_epoch": 2,
    "n_parameters": 82119938,
    "n_train_used": 159980,
    "data_seed": 42
  }
}
```

Versions per model:

```json
{
  "tfidf-lr": {
    "python": "3.13.15",
    "scikit-learn": "1.6.1",
    "numpy": "2.1.3",
    "torch": "2.11.0+cu130",
    "transformers": "5.20.1"
  },
  "tfidf-nb": {
    "python": "3.13.15",
    "scikit-learn": "1.6.1",
    "numpy": "2.1.3",
    "torch": "2.11.0+cu130",
    "transformers": "5.20.1"
  },
  "transformer-distilroberta-base": {
    "python": "3.13.15",
    "scikit-learn": "1.6.1",
    "numpy": "2.1.3",
    "torch": "2.11.0+cu130",
    "transformers": "5.20.1"
  },
  "transformer-distilroberta-base+saved": {
    "python": "3.13.15",
    "scikit-learn": "1.6.1",
    "numpy": "2.1.3",
    "torch": "2.11.0+cu130",
    "transformers": "5.20.1"
  }
}
```

One training seed per model; no variance across seeds is reported.
