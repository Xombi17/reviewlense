"""Turn saved predictions into metrics, figures and a Markdown report.

Training writes ``predictions.npz`` (log-odds per model for the validation and test
splits) and ``meta.json``. Everything here is derived from those two files, so a run
trained elsewhere (e.g. a Colab GPU) can be analysed by copying them back and running

    python -m experiments.report --run-dir experiments/results/<run>
"""

import argparse
import itertools
import json
import os
from typing import Dict, List

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from .metrics import (  # noqa: E402
    COVERAGE_LEVELS,
    fit_temperature,
    mcnemar_test,
    paired_bootstrap_accuracy_diff,
    reliability_bins,
    risk_coverage,
    summarize,
    tier_breakdown,
)

PALETTE = ["#2563eb", "#d97706", "#059669", "#7c3aed", "#dc2626"]


def load_run(run_dir: str):
    with open(os.path.join(run_dir, "meta.json"), "r", encoding="utf-8") as handle:
        meta = json.load(handle)
    arrays = np.load(os.path.join(run_dir, "predictions.npz"))
    return meta, {key: arrays[key] for key in arrays.files}


def analyse(meta: dict, arrays: Dict[str, np.ndarray], n_boot: int = 1000) -> dict:
    y_val, y_test = arrays["y_val"], arrays["y_test"]
    models = list(meta["models"])
    analysis: Dict[str, object] = {"models": {}, "comparisons": []}

    for name in models:
        val_logits, test_logits = arrays[f"{name}__val"], arrays[f"{name}__test"]
        temperature = fit_temperature(y_val, val_logits)
        analysis["models"][name] = {
            "uncalibrated": summarize(y_test, test_logits, 1.0, n_boot),
            "calibrated": summarize(y_test, test_logits, temperature, n_boot, with_ci=False),
            "selective": risk_coverage(y_test, test_logits),
            "tiers_uncalibrated": tier_breakdown(y_test, test_logits, 1.0),
            "tiers_calibrated": tier_breakdown(y_test, test_logits, temperature),
            "reliability_uncalibrated": reliability_bins(y_test, test_logits, 1.0),
            "reliability_calibrated": reliability_bins(y_test, test_logits, temperature),
        }

    for name_a, name_b in itertools.combinations(models, 2):
        logits_a, logits_b = arrays[f"{name_a}__test"], arrays[f"{name_b}__test"]
        analysis["comparisons"].append(
            {
                "a": name_a,
                "b": name_b,
                "accuracy_diff": paired_bootstrap_accuracy_diff(y_test, logits_a, logits_b, n_boot),
                "mcnemar": mcnemar_test(y_test, logits_a, logits_b),
            }
        )
    return analysis


def _plot_reliability(meta: dict, analysis: dict, arrays: Dict[str, np.ndarray], path: str) -> None:
    models = list(meta["models"])
    figure, axes = plt.subplots(1, len(models), figsize=(4.2 * len(models), 4), squeeze=False)
    for axis, name in zip(axes[0], models):
        entry = analysis["models"][name]
        lowest_accuracy = 0.5
        for key, label, style, color in (
            ("reliability_uncalibrated", "raw", "--", PALETTE[0]),
            ("reliability_calibrated", "temperature scaled", "-", PALETTE[1]),
        ):
            bins = [b for b in entry[key] if b["count"]]
            confidences = [b["confidence"] for b in bins]
            accuracies = [b["accuracy"] for b in bins]
            lowest_accuracy = min([lowest_accuracy] + accuracies)
            axis.plot(confidences, accuracies, style, color=color, label=label)
            # marker area is proportional to the bin's review count, so thin bins look thin
            axis.scatter(
                confidences,
                accuracies,
                s=[10 + 300 * b["count"] / len(arrays["y_test"]) for b in bins],
                color=color,
                zorder=3,
            )
        axis.plot([0.5, 1], [0.5, 1], color="#6b7280", linewidth=1, label="perfect calibration")
        axis.set_title(name)
        axis.set_xlabel("confidence (marker size = reviews in bin)")
        axis.set_ylabel("accuracy")
        axis.set_xlim(0.5, 1.0)
        # never clip bins whose accuracy falls below 0.5
        axis.set_ylim(max(0.0, np.floor((lowest_accuracy - 0.05) * 10) / 10), 1.0)
        axis.grid(alpha=0.25)
    axes[0][0].legend(fontsize=8, loc="upper left")
    figure.tight_layout()
    figure.savefig(path, dpi=140)
    plt.close(figure)


def _plot_risk_coverage(meta: dict, analysis: dict, path: str) -> None:
    figure, axis = plt.subplots(figsize=(5.5, 4))
    for color, name in zip(PALETTE, meta["models"]):
        curve = analysis["models"][name]["selective"]["curve"]
        axis.plot(curve["coverage"], np.array(curve["risk"]) * 100, color=color, label=name)
    axis.set_xlabel("coverage (share of predictions kept, most confident first)")
    axis.set_ylabel("error rate on kept predictions (%)")
    axis.grid(alpha=0.25)
    axis.legend(fontsize=8)
    figure.tight_layout()
    figure.savefig(path, dpi=140)
    plt.close(figure)


def _fmt_ci(value: float, ci, digits: int = 4) -> str:
    return f"{value:.{digits}f} [{ci[0]:.{digits}f}, {ci[1]:.{digits}f}]"


def _fmt_pct(value: float) -> str:
    return "n/a" if value != value else f"{value * 100:.1f}%"


def render_markdown(meta: dict, analysis: dict) -> str:
    models = list(meta["models"])
    sizes = meta["split_sizes"]
    lines: List[str] = []
    add = lines.append

    add(f"# Model comparison: {meta['data_source']} data")
    add("")
    add(
        f"Splits: train {sizes['train']:,} / val {sizes['val']:,} / test {sizes['test']:,} "
        f"(seed {meta['seed']}, fingerprint `{meta['split_fingerprint']}`). "
        "Hyperparameters and the calibration temperature are fitted on validation only; "
        "all numbers below are on the held-out test split. Brackets are 95% bootstrap intervals."
    )
    if meta.get("note"):
        add("")
        add(f"> {meta['note']}")
    add("")

    add("## Accuracy and calibration")
    add("")
    add("| Model | Accuracy | F1 | AUC | NLL | Brier | ECE (raw) | ECE (scaled) | T |")
    add("| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |")
    for name in models:
        raw = analysis["models"][name]["uncalibrated"]
        scaled = analysis["models"][name]["calibrated"]
        add(
            f"| {name} | {_fmt_ci(raw['accuracy'], raw['accuracy_ci'])} | {raw['f1']:.4f} | "
            f"{_fmt_ci(raw['auc'], raw['auc_ci'])} | {raw['nll']:.4f} | {raw['brier']:.4f} | "
            f"{_fmt_ci(raw['ece'], raw['ece_ci'])} | {scaled['ece']:.4f} | {scaled['temperature']:.2f} |"
        )
    add("")
    add(
        "ECE is the expected calibration error over 10 equal-width confidence bins (lower is "
        "better). T is the temperature fitted on validation; T > 1 means the raw model was overconfident."
    )
    add("")
    edge_models = [
        name for name in models if meta["models"][name]["config"].get("at_grid_edge")
    ]
    for name in edge_models:
        config = meta["models"][name]["config"]
        chosen = config.get("C", config.get("alpha"))
        add(
            f"> **{name}** picked {chosen} at the edge of its search grid "
            f"({min(config['grid'])} to {max(config['grid'])}), so a better value may lie outside "
            "it and this baseline may be slightly under-tuned."
        )
        add("")

    add("## Cost")
    add("")
    add("| Model | Parameters | Train (s) | Test inference (s) | ms / review | Hardware |")
    add("| :-- | :-- | :-- | :-- | :-- | :-- |")
    for name in models:
        info = meta["models"][name]
        params = info.get("n_parameters")
        per_review = info["inference_seconds"] / sizes["test"] * 1000
        add(
            f"| {name} | {f'{params:,}' if params else 'n/a'} | {info['train_seconds']:.0f} | "
            f"{info['inference_seconds']:.1f} | {per_review:.2f} | {info.get('hardware', 'not recorded')} |"
        )
    add("")
    add("Timings are wall-clock on the hardware shown, so they are only comparable between rows run on the same machine.")
    add("")

    add("## Selective prediction (abstain on the least confident)")
    add("")
    header = " | ".join(f"acc @ {level:.0%}" for level in COVERAGE_LEVELS)
    add(f"| Model | {header} | AURC |")
    add("| :-- | " + " | ".join([":--"] * (len(COVERAGE_LEVELS) + 1)) + " |")
    for name in models:
        selective = analysis["models"][name]["selective"]
        cells = " | ".join(
            f"{selective['accuracy_at_coverage'][f'{level:.2f}'] * 100:.2f}%" for level in COVERAGE_LEVELS
        )
        add(f"| {name} | {cells} | {selective['aurc']:.4f} |")
    add("")
    add(
        "Temperature scaling is monotonic, so it cannot change which predictions rank as "
        "most confident; this table is identical before and after calibration. AURC is the "
        "area under the risk-coverage curve (lower is better)."
    )
    add("")
    add("![Risk-coverage](risk_coverage.png)")
    add("")

    add("## Do the API's reliability tiers mean something?")
    add("")
    add("The API labels predictions HIGH (confidence >= 0.90), MEDIUM (>= 0.70) and LOW. Share of test reviews and accuracy inside each tier:")
    add("")
    add("| Model | Calibration | HIGH share / acc | MEDIUM share / acc | LOW share / acc |")
    add("| :-- | :-- | :-- | :-- | :-- |")
    for name in models:
        for key, label in (("tiers_uncalibrated", "raw"), ("tiers_calibrated", "scaled")):
            tiers = analysis["models"][name][key]
            cells = " | ".join(
                f"{_fmt_pct(tiers[tier]['share'])} / {_fmt_pct(tiers[tier]['accuracy'])}"
                for tier in ("HIGH", "MEDIUM", "LOW")
            )
            add(f"| {name} | {label} | {cells} |")
    add("")
    add("![Reliability diagrams](reliability.png)")
    add("")

    add("## Pairwise comparison")
    add("")
    add("Accuracy(A) - Accuracy(B) with a paired bootstrap interval, and an exact McNemar test on the reviews where exactly one model is right.")
    add("")
    add("| A | B | Delta accuracy | only A right | only B right | McNemar p |")
    add("| :-- | :-- | :-- | :-- | :-- | :-- |")
    for comparison in analysis["comparisons"]:
        diff, test = comparison["accuracy_diff"], comparison["mcnemar"]
        add(
            f"| {comparison['a']} | {comparison['b']} | "
            f"{_fmt_ci(diff['diff'], (diff['ci_low'], diff['ci_high']))} | "
            f"{test['only_a_correct']} | {test['only_b_correct']} | {test['p_value']:.4g} |"
        )
    add("")

    add("## Setup")
    add("")
    add("```json")
    add(json.dumps({name: meta["models"][name]["config"] for name in models}, indent=2))
    add("```")
    add("")
    add("Versions per model:")
    add("")
    add("```json")
    add(json.dumps({name: meta["models"][name].get("versions", {}) for name in models}, indent=2))
    add("```")
    add("")
    add("One training seed per model; no variance across seeds is reported.")
    add("")
    return "\n".join(lines)


def build_report(run_dir: str, n_boot: int = 1000) -> str:
    meta, arrays = load_run(run_dir)
    analysis = analyse(meta, arrays, n_boot)

    # The full risk-coverage curves are derivable from predictions.npz; keep the JSON small.
    compact = json.loads(json.dumps(analysis))
    for entry in compact["models"].values():
        entry["selective"].pop("curve")
    with open(os.path.join(run_dir, "results.json"), "w", encoding="utf-8") as handle:
        json.dump(compact, handle, indent=2)
    _plot_reliability(meta, analysis, arrays, os.path.join(run_dir, "reliability.png"))
    _plot_risk_coverage(meta, analysis, os.path.join(run_dir, "risk_coverage.png"))

    markdown = render_markdown(meta, analysis)
    report_path = os.path.join(run_dir, "report.md")
    with open(report_path, "w", encoding="utf-8") as handle:
        handle.write(markdown)
    return report_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Regenerate the report for a saved run")
    parser.add_argument("--run-dir", required=True)
    parser.add_argument("--n-boot", type=int, default=1000)
    arguments = parser.parse_args()
    print(build_report(arguments.run_dir, arguments.n_boot))
