import io

import pytest


@pytest.mark.anyio
async def test_batch_endpoint_happy_path(api_client):
    csv_bytes = io.BytesIO(
        b"reviewText\nGreat battery life and clear sound.\nTerrible mic quality.\n"
    )

    response = await api_client.post(
        "/batch",
        files={"file": ("reviews.csv", csv_bytes.getvalue(), "text/csv")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert payload["processed"] == 2
    assert payload["skipped"] == 0
    assert set(payload["sentiment_distribution"].keys()) == {"positive", "negative"}
    assert set(payload["reliability_breakdown"].keys()) == {"HIGH", "MEDIUM", "LOW"}


@pytest.mark.anyio
async def test_batch_endpoint_missing_column_error(api_client):
    csv_bytes = io.BytesIO(b"text\nThis file lacks the required column.\n")

    response = await api_client.post(
        "/batch",
        files={"file": ("reviews.csv", csv_bytes.getvalue(), "text/csv")},
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": True,
        "code": "MISSING_COLUMN",
        "message": "Required column 'reviewText' is missing from the uploaded CSV.",
    }
