import io
import json
import math
import os

import httpx
import numpy as np
import pytest

torch = pytest.importorskip("torch")
pytest.importorskip("transformers")

from backend.experiments.tiny_model import build_tiny_classifier
from backend.main import app
from backend.ml.aspects import AspectExtractor
from backend.ml.loader import ModelLoader
from backend.ml.predictor import Predictor
from backend.ml.preprocessing import clean_review_text
from backend.ml.transformer_classifier import (
    TransformerClassifier,
    TransformerLoadError,
    _read_calibration,
)
from backend.ml.trust import TrustAnalyzer

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
TEMPERATURE = 1.7
VOCAB_TEXT = [
    "the battery is great but the mic is bad it works well and sounds terrible sometimes",
    "great product love it terrible quality hate it awful shipping fast delivery",
]


def _write_model(path, temperature=TEMPERATURE, calibration=True):
    torch.manual_seed(0)
    model, tokenizer = build_tiny_classifier(VOCAB_TEXT)
    os.makedirs(path, exist_ok=True)
    model.save_pretrained(path)
    tokenizer.save_pretrained(path)
    if calibration:
        with open(os.path.join(path, "calibration.json"), "w") as handle:
            json.dump(
                {"temperature": temperature, "positive_class_index": 1, "max_length": 32,
                 "base_model": "tiny-test-model", "val_accuracy": 0.5},
                handle,
            )
    return str(path)


@pytest.fixture(scope="module")
def model_dir(tmp_path_factory):
    return _write_model(tmp_path_factory.mktemp("saved") / "model")


@pytest.fixture(scope="module")
def classifier(model_dir):
    return TransformerClassifier.load(model_dir, device="cpu")


REVIEWS = [
    "The battery is GREAT!!! but the mic is bad.",
    "Terrible quality, hate it.",
    "it works well and sounds great sometimes but the delivery was awful and slow",
    "ok",
]


def test_scores_keep_input_order_regardless_of_batch_size(classifier):
    classifier.batch_size = 1
    one_by_one = classifier.scores(REVIEWS)
    classifier.batch_size = 8
    together = classifier.scores(REVIEWS)

    np.testing.assert_allclose(together, one_by_one, atol=1e-4)
    assert together.shape == (len(REVIEWS),)


def test_confidence_is_the_temperature_scaled_probability_and_labels_ignore_temperature(classifier):
    scores = classifier.scores(REVIEWS)
    classifier.temperature = 1.0
    sharp = classifier.predict(REVIEWS)
    classifier.temperature = 3.0
    soft = classifier.predict(REVIEWS)
    classifier.temperature = TEMPERATURE

    for score, sharp_result, soft_result in zip(scores, sharp, soft):
        for temperature, result in ((1.0, sharp_result), (3.0, soft_result)):
            probability = 1 / (1 + math.exp(-score / temperature))
            assert result["confidence"] == pytest.approx(max(probability, 1 - probability), abs=1e-4)
        assert sharp_result["sentiment"] == soft_result["sentiment"] == int(score > 0)
        assert soft_result["confidence"] <= sharp_result["confidence"]


def test_tier_and_flags_follow_the_calibrated_confidence(classifier):
    for result in classifier.predict(REVIEWS):
        expected = "HIGH" if result["confidence"] >= 0.9 else "MEDIUM" if result["confidence"] >= 0.7 else "LOW"
        assert result["reliability"] == expected
        assert ("uncertain_prediction" in result["flags"]) == (result["confidence"] < 0.7)


def test_load_requires_a_valid_calibration(tmp_path):
    with pytest.raises(TransformerLoadError, match="calibration.json not found"):
        TransformerClassifier.load(_write_model(tmp_path / "no_cal", calibration=False), device="cpu")
    for bad in (0, -1.0, float("nan")):
        with pytest.raises(TransformerLoadError, match="Invalid temperature"):
            _read_calibration(_write_model(tmp_path / f"bad_{bad}", temperature=bad))
    with pytest.raises(TransformerLoadError, match="Model directory not found"):
        TransformerClassifier.load(str(tmp_path / "missing" / "nowhere"), device="cpu")


def test_unreachable_hub_ids_raise_a_clear_error(monkeypatch):
    import huggingface_hub

    def offline(repo_id, filename):
        raise ConnectionError("offline")

    monkeypatch.setattr(huggingface_hub, "hf_hub_download", offline)

    with pytest.raises(TransformerLoadError, match="Could not fetch calibration.json"):
        TransformerClassifier.load("someone/reviewlens-distilroberta", device="cpu")
    # a relative path that does not exist looks like a hub id; the message covers both readings
    with pytest.raises(TransformerLoadError, match="meant to be a local directory"):
        TransformerClassifier.load("models/transformer", device="cpu")


def test_hub_ids_fetch_calibration_from_the_hub(model_dir, monkeypatch):
    import huggingface_hub

    requested = {}

    def fake_download(repo_id, filename):
        requested["call"] = (repo_id, filename)
        return os.path.join(model_dir, filename)

    monkeypatch.setattr(huggingface_hub, "hf_hub_download", fake_download)

    calibration = _read_calibration("someone/reviewlens-distilroberta")

    assert requested["call"] == ("someone/reviewlens-distilroberta", "calibration.json")
    assert calibration["temperature"] == TEMPERATURE


def test_loader_serves_the_transformer_only_when_configured(model_dir, monkeypatch):
    monkeypatch.delenv("TRANSFORMER_MODEL", raising=False)
    plain = ModelLoader(models_dir=MODELS_DIR)
    plain.load_all_models()
    assert plain.available_models() == ["lr", "nb"] and plain.transformer is None

    monkeypatch.setenv("TRANSFORMER_MODEL", model_dir)
    monkeypatch.setenv("TRANSFORMER_DEVICE", "cpu")
    with_transformer = ModelLoader(models_dir=MODELS_DIR)
    with_transformer.load_all_models()
    assert with_transformer.available_models() == ["lr", "nb", "transformer"]
    assert set(with_transformer.models) == {"lr", "nb"}

    monkeypatch.setenv("TRANSFORMER_MODEL", model_dir + "-typo")
    with pytest.raises(TransformerLoadError):
        ModelLoader(models_dir=MODELS_DIR).load_all_models()


@pytest.fixture(scope="module")
def serving(model_dir):
    os.environ["TRANSFORMER_MODEL"] = model_dir
    os.environ["TRANSFORMER_DEVICE"] = "cpu"
    try:
        loader = ModelLoader(models_dir=MODELS_DIR)
        loader.load_all_models()
    finally:
        del os.environ["TRANSFORMER_MODEL"], os.environ["TRANSFORMER_DEVICE"]
    predictor = Predictor(loader)
    return loader, predictor, AspectExtractor(predictor)


@pytest.fixture()
async def client(serving, monkeypatch):
    loader, predictor, extractor = serving
    stats = json.load(open(os.path.join(os.path.dirname(MODELS_DIR), "data", "stats.json")))
    for name, value in (("loader", loader), ("predictor", predictor), ("extractor", extractor),
                        ("trust_analyzer", TrustAnalyzer()), ("stats", stats)):
        monkeypatch.setattr(app.state, name, value, raising=False)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as http_client:
        yield http_client


def _spy(loader, monkeypatch):
    seen = []
    original = loader.transformer.predict

    def spy(texts):
        seen.append(list(texts))
        return original(texts)

    monkeypatch.setattr(loader.transformer, "predict", spy)
    return seen


@pytest.mark.anyio
async def test_models_endpoint_lists_the_transformer_as_calibrated(client):
    payload = (await client.get("/models")).json()
    by_id = {model["id"]: model for model in payload["models"]}

    assert list(by_id) == ["lr", "nb", "transformer"]
    assert by_id["lr"]["is_default"] and not by_id["lr"]["calibrated"]
    assert by_id["transformer"]["calibrated"] and by_id["transformer"]["temperature"] == TEMPERATURE
    assert by_id["transformer"]["base_model"] == "tiny-test-model"


@pytest.mark.anyio
async def test_predict_with_the_transformer_reads_the_review_as_written(client, serving, monkeypatch):
    loader, _, _ = serving
    seen = _spy(loader, monkeypatch)
    review = "The battery is GREAT!!! but the mic is bad."

    response = await client.post("/predict", json={"review": review, "model": "transformer"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["model_used"] == "transformer"
    assert payload["sentiment"] in (0, 1) and 0.5 <= payload["confidence"] <= 1.0
    assert payload["reliability"] in ("HIGH", "MEDIUM", "LOW")
    assert {aspect["aspect"] for aspect in payload["aspects"]} == {"battery", "mic"}
    # the whole review reached the model uncleaned, and each aspect sentence was scored in one pass
    assert seen[0] == [review]
    assert review != clean_review_text(review)
    assert len(seen) == 2 and len(seen[1]) == 2
    expected = loader.transformer.predict([review])[0]
    assert (payload["sentiment"], payload["confidence"], payload["reliability"]) == (
        expected["sentiment"], expected["confidence"], expected["reliability"])


@pytest.mark.anyio
async def test_punctuation_only_review_is_flagged_empty_for_the_transformer(client):
    payload = (await client.post("/predict", json={"review": "!!! ???", "model": "transformer"})).json()

    assert payload["confidence"] == 0.5 and "empty_text" in payload["flags"]


@pytest.mark.anyio
async def test_batch_with_the_transformer_scores_every_review_in_one_pass(client, serving, monkeypatch):
    loader, _, _ = serving
    seen = _spy(loader, monkeypatch)
    csv = b'reviewText\nGreat battery life.\n""\n"Terrible mic quality, hate it."\nit works well\n'

    response = await client.post("/batch", params={"model": "transformer"},
                                 files={"file": ("r.csv", csv, "text/csv")})

    assert response.status_code == 200
    payload = response.json()
    assert payload["model_used"] == "transformer"
    assert payload["processed"] == 3 and payload["skipped"] == 1
    assert len(seen) == 1 and len(seen[0]) == 3


@pytest.mark.anyio
async def test_batch_with_the_transformer_enforces_its_row_cap(client, monkeypatch):
    monkeypatch.setenv("TRANSFORMER_MAX_BATCH_ROWS", "2")
    csv = b"reviewText\none good review\ntwo good reviews\nthree good reviews\n"

    response = await client.post("/batch", params={"model": "transformer"},
                                 files={"file": ("r.csv", csv, "text/csv")})

    assert response.status_code == 422
    assert "at most 2" in response.json()["message"]

    # the TF-IDF default has no such cap
    default = await client.post("/batch", files={"file": ("r.csv", csv, "text/csv")})
    assert default.status_code == 200 and default.json()["model_used"] == "lr"
