import numpy as np

from backend.experiments.report import analyse, render_markdown, seed_groups


def _meta(rows):
    return {
        "data_source": "synthetic", "seed": 42, "split_fingerprint": "x",
        "split_sizes": {"train": 1, "val": 1, "test": 400},
        "models": {
            name: {
                "config": {"model_name": "tiny", "learning_rate": 1e-3, "epochs": 2,
                           "max_length": 16, "batch_size": 8, "max_train_samples": None, "train_seed": seed},
                "train_seconds": 1.0, "inference_seconds": 1.0, "n_parameters": 10,
            }
            for name, seed in rows.items()
        },
    }


def test_seed_groups_count_each_seed_once_and_split_out_repeats():
    meta = _meta({"m": 42, "m+s7": 7, "m+s8": 8, "m+again": 42})
    meta["models"]["tfidf-lr"] = {"config": {"C": 1.0}}

    groups = seed_groups(meta)

    assert len(groups) == 1
    assert list(groups[0]["seeds"]) == [42, 7, 8]
    assert groups[0]["repeats"] == [("m+again", "m")]


def test_old_rows_without_train_seed_fall_back_to_seed():
    meta = _meta({"m": 42})
    config = meta["models"]["m"]["config"]
    del config["train_seed"]
    config["seed"] = 42
    meta["models"]["m+s7"] = {"config": {**config, "seed": 7}}

    assert list(seed_groups(meta)[0]["seeds"]) == [42, 7]


def test_report_shows_seed_variance_with_mean_and_spread():
    rng = np.random.default_rng(0)
    y = (rng.random(400) < 0.5).astype(int)
    arrays = {"y_val": y, "y_test": y}
    rows = {"m": 42, "m+s7": 7, "m+s8": 8, "m+again": 42}
    for index, name in enumerate(rows):
        for split in ("val", "test"):
            arrays[f"{name}__{split}"] = (2 * y - 1) * rng.normal(1.0 + 0.1 * index, 1.5, 400)
    meta = _meta(rows)

    markdown = render_markdown(meta, analyse(meta, arrays, n_boot=20))

    assert "## Seed variance" in markdown
    assert "3 seeds (42, 7, 8)" in markdown
    assert "`m+again` re-ran the configuration of `m` with the same seed" in markdown
    assert "±" in markdown


def test_report_omits_seed_variance_with_a_single_seed():
    rng = np.random.default_rng(0)
    y = (rng.random(300) < 0.5).astype(int)
    arrays = {"y_val": y, "y_test": y, "m__val": (2 * y - 1) * rng.normal(1, 1, 300),
              "m__test": (2 * y - 1) * rng.normal(1, 1, 300)}
    meta = _meta({"m": 42})

    assert "Seed variance" not in render_markdown(meta, analyse(meta, arrays, n_boot=20))


def _synthetic_run(n=400):
    rng = np.random.default_rng(1)
    y = (rng.random(n) < 0.5).astype(int)
    rows = {"m": 42, "m+s7": 7, "m+s8": 8}
    meta = _meta(rows)
    meta["models"]["tfidf-lr"] = {
        "config": {"C": 1.0}, "train_seconds": 1.0, "inference_seconds": 1.0, "n_parameters": None,
    }
    arrays = {"y_val": y, "y_test": y}
    for index, name in enumerate([*rows, "tfidf-lr"]):
        for split in ("val", "test"):
            arrays[f"{name}__{split}"] = (2 * y - 1) * rng.normal(1.0 + 0.1 * index, 1.5, n)
    return meta, arrays


def _pairwise_rows(markdown):
    section = markdown.split("## Pairwise comparison")[1].split("## Seed variance")[0]
    lines = [line for line in section.splitlines() if line.startswith("| ") and not line.startswith("| :--")]
    return lines[1:]  # drop the header row


def test_pairwise_table_keeps_one_row_per_seed_group_but_results_keep_everything():
    meta, arrays = _synthetic_run()
    analysis = analyse(meta, arrays, n_boot=20)

    rows = _pairwise_rows(render_markdown(meta, analysis))

    # only the primary seed "m" vs the TF-IDF model remains; no "m+s7"/"m+s8" in the table
    assert len(rows) == 1 and "| m |" in rows[0] and "tfidf-lr" in rows[0]
    assert "m+s7" not in "".join(rows) and "m+s8" not in "".join(rows)
    # the omitted pairs are still computed and available for results.json
    assert len(analysis["comparisons"]) == 6


def test_seed_variance_summarises_agreement_between_seeds():
    meta, arrays = _synthetic_run()
    markdown = render_markdown(meta, analyse(meta, arrays, n_boot=20))

    assert "Across the 3 pairs of seeds, the largest accuracy difference is" in markdown
    assert "smallest McNemar p-value is" in markdown


def test_footer_matches_whether_seed_variance_is_reported():
    meta, arrays = _synthetic_run()
    with_variance = render_markdown(meta, analyse(meta, arrays, n_boot=20))
    assert "Seed variance is measured for the fine-tuned rows above" in with_variance
    assert "no variance across seeds is reported" not in with_variance

    single = _meta({"m": 42})
    rng = np.random.default_rng(0)
    y = (rng.random(300) < 0.5).astype(int)
    solo = {"y_val": y, "y_test": y, "m__val": (2 * y - 1) * rng.normal(1, 1, 300),
            "m__test": (2 * y - 1) * rng.normal(1, 1, 300)}
    without = render_markdown(single, analyse(single, solo, n_boot=20))
    assert "no variance across seeds is reported" in without
    assert "Seed variance is measured" not in without
