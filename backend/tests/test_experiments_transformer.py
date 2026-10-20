import numpy as np
import pytest

torch = pytest.importorskip("torch")
pytest.importorskip("transformers")

from backend.experiments.metrics import predict_labels
from backend.experiments.tiny_model import build_tiny_classifier
from backend.experiments.transformer import (
    FinetuneConfig,
    choose_amp_dtype,
    finetune,
    predict_logits,
    resolve_device,
)

POSITIVE = ["great product love it", "excellent quality works perfectly", "really happy amazing value"]
NEGATIVE = ["terrible product hate it", "awful quality broke immediately", "really angry waste of money"]


def _synthetic(n_per_class, seed):
    rng = np.random.default_rng(seed)
    texts, labels = [], []
    for _ in range(n_per_class):
        texts.append(rng.choice(POSITIVE))
        labels.append(1)
        texts.append(rng.choice(NEGATIVE))
        labels.append(0)
    order = rng.permutation(len(texts))
    return [texts[i] for i in order], np.array(labels)[order]


def _fresh_tiny():
    # a new randomly initialised model per test, seeded so runs are repeatable
    torch.manual_seed(0)
    texts, _ = _synthetic(20, 0)
    return build_tiny_classifier(texts)


@pytest.fixture()
def tiny():
    return _fresh_tiny()


def test_tiny_tokenizer_knows_its_vocabulary(tiny):
    _, tokenizer = tiny
    tokens = tokenizer.convert_ids_to_tokens(tokenizer("Great product love it")["input_ids"])
    assert tokens == ["[CLS]", "great", "product", "love", "it", "[SEP]"]


def _config(**overrides):
    base = dict(
        max_length=16, batch_size=16, eval_batch_size=16, learning_rate=5e-3,
        epochs=6, device="cpu", log_every=0,
    )
    base.update(overrides)
    return FinetuneConfig(**base)


def test_finetune_learns_a_separable_toy_task_and_returns_aligned_logits(tiny):
    model, tokenizer = tiny
    train_text, y_train = _synthetic(60, 1)
    val_text, y_val = _synthetic(15, 2)
    test_text, y_test = _synthetic(15, 3)

    result = finetune(train_text, y_train, val_text, y_val, test_text, _config(),
                      model=model, tokenizer=tokenizer)

    assert result["val_logits"].shape == (len(val_text),)
    assert result["test_logits"].shape == (len(test_text),)
    assert np.mean(predict_labels(result["test_logits"]) == y_test) > 0.95
    assert len(result["history"]) == 6
    assert 1 <= result["config"]["best_epoch"] <= 6
    assert result["config"]["n_parameters"] > 0
    assert result["inference_seconds"] >= 0


def test_predict_logits_restores_input_order_regardless_of_length(tiny):
    model, tokenizer = tiny
    texts = ["great", "terrible product hate it really angry waste of money", "love it", "awful"]
    cfg = _config(eval_batch_size=2)

    together = predict_logits(model, tokenizer, texts, cfg, resolve_device("cpu"))
    one_by_one = np.array([
        predict_logits(model, tokenizer, [text], cfg, resolve_device("cpu"))[0] for text in texts
    ])

    np.testing.assert_allclose(together, one_by_one, atol=1e-4)


def test_max_train_samples_limits_training_set(tiny):
    model, tokenizer = tiny
    train_text, y_train = _synthetic(40, 1)
    val_text, y_val = _synthetic(5, 2)

    result = finetune(train_text, y_train, val_text, y_val, val_text,
                      _config(epochs=1, max_train_samples=20), model=model, tokenizer=tokenizer)

    assert result["config"]["n_train_used"] == 20


def test_amp_dtype_ignores_emulated_bf16(monkeypatch):
    # A T4 reports bf16 as supported only through emulation; that must not select bf16.
    monkeypatch.setattr(
        torch.cuda,
        "is_bf16_supported",
        lambda including_emulation=True: bool(including_emulation),
    )
    assert choose_amp_dtype() == torch.float16

    monkeypatch.setattr(torch.cuda, "is_bf16_supported", lambda including_emulation=True: True)
    assert choose_amp_dtype() == torch.bfloat16
