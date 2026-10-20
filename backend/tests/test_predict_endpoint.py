import pytest


@pytest.mark.anyio
async def test_predict_endpoint_happy_path(api_client):
    response = await api_client.post(
        "/predict",
        json={"review": "The battery life is excellent and the sound is clear."},
    )

    assert response.status_code == 200
    payload = response.json()
    assert set(payload.keys()) == {
        "sentiment",
        "confidence",
        "reliability",
        "aspects",
        "trust_score",
        "flags",
        "model_used",
    }
    assert payload["model_used"] == "lr"
    assert isinstance(payload["aspects"], list)
    assert isinstance(payload["flags"], list)


@pytest.mark.anyio
async def test_predict_endpoint_empty_review_error(api_client):
    response = await api_client.post("/predict", json={"review": "   ", "model": "lr"})

    assert response.status_code == 400
    assert response.json() == {
        "error": True,
        "code": "EMPTY_REVIEW",
        "message": "Review text is empty or whitespace-only.",
    }


@pytest.mark.anyio
async def test_predict_endpoint_invalid_model_error(api_client):
    response = await api_client.post(
        "/predict",
        json={"review": "Solid sound quality overall.", "model": "invalid"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "MODEL_NOT_FOUND"


@pytest.mark.anyio
async def test_transformer_is_rejected_when_not_configured(api_client):
    response = await api_client.post(
        "/predict", json={"review": "Solid sound quality overall.", "model": "transformer"}
    )

    assert response.status_code == 400
    body = response.json()
    assert body["code"] == "MODEL_NOT_FOUND"
    assert "Available: ['lr', 'nb']" in body["message"]


@pytest.mark.anyio
async def test_models_endpoint_lists_only_the_tfidf_models_by_default(api_client):
    payload = (await api_client.get("/models")).json()

    assert [model["id"] for model in payload["models"]] == ["lr", "nb"]
    assert not any(model["calibrated"] for model in payload["models"])
