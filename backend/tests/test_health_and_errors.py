import pytest
from fastapi import APIRouter

from backend.main import app


@pytest.mark.anyio
async def test_health_endpoint(api_client):
    response = await api_client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.anyio
async def test_unhandled_exception_does_not_leak_details(api_test_app):
    import httpx

    router = APIRouter()

    @router.get("/_boom")
    async def boom():
        raise RuntimeError("secret internal detail")

    api_test_app.include_router(router)
    transport = httpx.ASGITransport(app=api_test_app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/_boom")

    assert response.status_code == 500
    body = response.json()
    assert body["code"] == "INTERNAL_ERROR"
    assert "secret internal detail" not in response.text
