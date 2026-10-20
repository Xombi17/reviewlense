"""Train the models being compared on shared splits and write a report.

Examples (from ``backend/``):

    # classical baselines on the 20k reviews checked into the repo
    python -m experiments.run_experiment --data local --out experiments/results/local-tfidf

    # add a fine-tuned transformer to that same run (needs torch + huggingface.co access)
    python -m experiments.run_experiment --data local --models transformer \\
        --model-name distilroberta-base --out experiments/results/local-tfidf --merge

    # larger run on Amazon polarity from the Hugging Face hub (GPU recommended)
    python -m experiments.run_experiment --data hf --n-total 200000 \\
        --models tfidf-lr tfidf-nb transformer --out experiments/results/hf-200k
"""

import argparse
import json
import os
import platform
import sys
from typing import Dict

import numpy as np

from .data import fingerprint, load_splits
from .report import build_report
from .tfidf_baseline import run_tfidf_baselines

TFIDF_MODELS = ("tfidf-lr", "tfidf-nb")
DEFAULT_OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")


def _versions() -> Dict[str, str]:
    import sklearn

    versions = {"python": platform.python_version(), "scikit-learn": sklearn.__version__, "numpy": np.__version__}
    try:
        import torch
        import transformers

        versions["torch"] = torch.__version__
        versions["transformers"] = transformers.__version__
    except ImportError:
        pass
    return versions


def _hardware() -> str:
    description = f"{platform.processor() or platform.machine()}, {os.cpu_count()} CPU threads"
    try:
        import torch

        if torch.cuda.is_available():
            description += f", GPU {torch.cuda.get_device_name(0)}"
        else:
            description += ", no GPU"
    except ImportError:
        pass
    return description


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", choices=("local", "hf"), default="local")
    parser.add_argument("--n-total", type=int, default=100_000, help="Reviews to sample when --data hf")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", default=os.path.join(DEFAULT_OUT, "local"))
    parser.add_argument("--models", nargs="+", default=list(TFIDF_MODELS), choices=(*TFIDF_MODELS, "transformer"))
    parser.add_argument("--merge", action="store_true", help="Add to an existing run in --out (splits must match)")
    parser.add_argument("--tag", default=None, help="Suffix for model names, e.g. 'clean' gives tfidf-lr+clean")
    parser.add_argument("--note", default=None, help="Free-text caveat printed at the top of the report")
    parser.add_argument("--n-boot", type=int, default=1000)

    tfidf = parser.add_argument_group("tf-idf baselines")
    tfidf.add_argument("--preprocess", choices=("raw", "clean"), default="raw")
    tfidf.add_argument("--max-features", type=int, default=100_000)

    transformer = parser.add_argument_group("transformer")
    transformer.add_argument("--model-name", default="distilroberta-base", help="Hub id or local directory")
    transformer.add_argument("--epochs", type=int, default=2)
    transformer.add_argument("--batch-size", type=int, default=32)
    transformer.add_argument("--lr", type=float, default=2e-5)
    transformer.add_argument("--max-length", type=int, default=256)
    transformer.add_argument("--max-train-samples", type=int, default=None)
    transformer.add_argument("--device", default=None)
    return parser.parse_args(argv)


def main(argv=None) -> str:
    args = parse_args(argv)
    os.makedirs(args.out, exist_ok=True)

    splits = load_splits(args.data, n_total=args.n_total, seed=args.seed)
    split_fingerprint = fingerprint(splits)
    print(f"splits: {splits.sizes()} fingerprint {split_fingerprint}")

    y_train = splits.train["label"].to_numpy()
    y_val = splits.val["label"].to_numpy()
    y_test = splits.test["label"].to_numpy()

    meta_path = os.path.join(args.out, "meta.json")
    predictions_path = os.path.join(args.out, "predictions.npz")
    meta = {"models": {}}
    arrays: Dict[str, np.ndarray] = {}
    if args.merge and os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as handle:
            meta = json.load(handle)
        if meta["split_fingerprint"] != split_fingerprint:
            sys.exit(
                f"Refusing to merge: existing run used splits {meta['split_fingerprint']} "
                f"but these are {split_fingerprint}. Use the same --data/--seed/--n-total."
            )
        stored = np.load(predictions_path)
        arrays = {key: stored[key] for key in stored.files}

    new_results = {}
    if any(model in TFIDF_MODELS for model in args.models):
        baselines = run_tfidf_baselines(
            splits.train["text"], y_train, splits.val["text"], y_val, splits.test["text"],
            preprocess=args.preprocess, max_features=args.max_features, seed=args.seed,
        )
        new_results.update({name: baselines[name] for name in args.models if name in baselines})

    if "transformer" in args.models:
        from .transformer import FinetuneConfig, finetune  # imported lazily: needs torch

        config = FinetuneConfig(
            model_name=args.model_name, max_length=args.max_length, batch_size=args.batch_size,
            learning_rate=args.lr, epochs=args.epochs, seed=args.seed,
            max_train_samples=args.max_train_samples, device=args.device,
        )
        outcome = finetune(
            splits.train["text"], y_train, splits.val["text"], y_val, splits.test["text"], config
        )
        new_results[f"transformer-{os.path.basename(args.model_name.rstrip('/'))}"] = outcome

    suffix = f"+{args.tag}" if args.tag else ""
    for base_name, outcome in new_results.items():
        name = f"{base_name}{suffix}"
        arrays[f"{name}__val"] = np.asarray(outcome["val_logits"])
        arrays[f"{name}__test"] = np.asarray(outcome["test_logits"])
        meta["models"][name] = {
            "config": outcome["config"],
            "train_seconds": outcome["train_seconds"],
            "inference_seconds": outcome["inference_seconds"],
            "n_parameters": outcome["config"].get("n_parameters"),
            "hardware": _hardware(),
            "versions": _versions(),
        }
    arrays["y_val"], arrays["y_test"] = y_val, y_test

    meta.update(
        {
            "data_source": args.data,
            "seed": args.seed,
            "split_sizes": splits.sizes(),
            "split_fingerprint": split_fingerprint,
        }
    )
    if args.note:
        meta["note"] = args.note

    np.savez_compressed(predictions_path, **arrays)
    with open(meta_path, "w", encoding="utf-8") as handle:
        json.dump(meta, handle, indent=2)

    report_path = build_report(args.out, args.n_boot)
    print(f"report written to {report_path}")
    return report_path


if __name__ == "__main__":
    main()
