import pytest


@pytest.mark.anyio
async def test_stats_endpoint_happy_path(api_client):
    response = await api_client.get("/stats")

    assert response.status_code == 200
    payload = response.json()
    assert "dataset_summary" in payload
    assert "models" in payload
    assert "reliability_summary" in payload
    assert "failure_modes" in payload
    assert set(payload["models"].keys()) == {"lr", "nb", "svm"}
