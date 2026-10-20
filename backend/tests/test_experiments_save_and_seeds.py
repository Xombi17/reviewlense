import json
import os

import numpy as np
import pytest

torch = pytest.importorskip("torch")
pytest.importorskip("transformers")

from backend.experiments.data import load_local_reviews
from backend.experiments.run_experiment import main
from backend.experiments.tiny_model import build_tiny_classifier
from backend.experiments.transformer import (
    CALIBRATION_FILE,
    FinetuneConfig,
    finetune,
    load_saved_classifier,
    verify_saved_classifier,
    write_calibration,
)

POSITIVE = ["great product love it", "excellent quality works perfectly"]
NEGATIVE = ["terrible product hate it", "awful quality broke immediately"]


def _data(n, seed):
    rng = np.random.default_rng(seed)
    labels = rng.integers(0, 2, n)
    texts = [str(rng.choice(POSITIVE if label else NEGATIVE)) for label in labels]
    return texts, labels


def _tiny():
    torch.manual_seed(0)  # identical initialisation across calls
    texts, _ = _data(40, 0)
    return build_tiny_classifier(texts)


def _config(**overrides):
    base = dict(max_length=16, batch_size=16, eval_batch_size=16, learning_rate=5e-3,
                epochs=2, device="cpu", log_every=0)
    base.update(overrides)
    return FinetuneConfig(**base)


def _run(seed, save_dir=None):
    model, tokenizer = _tiny()
    train, y_train = _data(96, 1)
    val, y_val = _data(24, 2)
    test, _ = _data(24, 3)
    return finetune(train, y_train, val, y_val, test, _config(seed=seed),
                    model=model, tokenizer=tokenizer, save_dir=save_dir)


def test_saved_model_reloads_and_reproduces_logits(tmp_path):
    save_dir = str(tmp_path / "saved")
    result = _run(seed=1, save_dir=save_dir)
    write_calibration(save_dir, 1.37, {"base_model": "tiny"})

    assert os.path.exists(os.path.join(save_dir, "config.json"))
    assert any(name.endswith(".safetensors") for name in os.listdir(save_dir))
    assert os.path.exists(os.path.join(save_dir, "tokenizer.json"))

    model, tokenizer, calibration = load_saved_classifier(save_dir)
    assert calibration["temperature"] == pytest.approx(1.37)
    assert calibration["positive_class_index"] == 1 and calibration["fit_on"] == "validation"

    test_texts, _ = _data(24, 3)
    worst = verify_saved_classifier(save_dir, test_texts, result["test_logits"], _config())
    assert worst < 1e-4


def test_verify_fails_loudly_when_logits_do_not_match(tmp_path):
    save_dir = str(tmp_path / "saved")
    result = _run(seed=1, save_dir=save_dir)
    write_calibration(save_dir, 1.0, {})
    test_texts, _ = _data(24, 3)

    with pytest.raises(RuntimeError, match="does not reproduce"):
        verify_saved_classifier(save_dir, test_texts, result["test_logits"] + 1.0, _config())


def test_training_seed_controls_training_only():
    first = _run(seed=1)
    repeat = _run(seed=1)
    other = _run(seed=2)

    np.testing.assert_allclose(first["test_logits"], repeat["test_logits"], atol=1e-6)
    assert not np.allclose(first["test_logits"], other["test_logits"], atol=1e-3)
    assert first["config"]["train_seed"] == 1 and other["config"]["train_seed"] == 2


def test_cli_end_to_end_saves_model_records_seeds_and_reports_variance(tmp_path):
    reviews = load_local_reviews()["text"].head(400).tolist()
    model, tokenizer = build_tiny_classifier(reviews)
    base_model = str(tmp_path / "tiny")
    model.save_pretrained(base_model)
    tokenizer.save_pretrained(base_model)
    out = str(tmp_path / "run")
    saved = str(tmp_path / "saved")
    common = ["--data", "local", "--models", "transformer", "--model-name", base_model,
              "--epochs", "1", "--max-train-samples", "300", "--max-length", "64",
              "--lr", "0.005", "--device", "cpu", "--n-boot", "20", "--out", out]

    main(common + ["--train-seed", "7", "--save-model", saved])
    main(common + ["--train-seed", "8", "--tag", "s8", "--merge"])

    meta = json.load(open(os.path.join(out, "meta.json")))
    assert sorted(meta["models"]) == ["transformer-tiny", "transformer-tiny+s8"]
    first, second = (meta["models"][name]["config"] for name in sorted(meta["models"]))
    assert (first["train_seed"], second["train_seed"]) == (7, 8)
    assert first["data_seed"] == second["data_seed"] == 42

    calibration = json.load(open(os.path.join(saved, CALIBRATION_FILE)))
    assert calibration["train_seed"] == 7 and calibration["data_seed"] == 42
    assert calibration["split_fingerprint"] == meta["split_fingerprint"]
    assert calibration["temperature"] > 0
    assert os.path.exists(os.path.join(saved, "config.json"))

    report = open(os.path.join(out, "report.md"), encoding="utf-8").read()
    assert "## Seed variance" in report and "2 seeds (7, 8)" in report


def test_save_model_requires_the_transformer():
    with pytest.raises(SystemExit):
        main(["--models", "tfidf-lr", "--save-model", "somewhere"])
