import httpx
import pytest
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.cors import cors_settings, is_allowed_by_default


def _app(allow_origins):
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware, **cors_settings(allow_origins),
        allow_credentials=False, allow_methods=["*"], allow_headers=["*"],
    )

    @app.get("/ping")
    async def ping():
        return {"ok": True}

    return app


async def _allowed_origin(app, origin):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/ping", headers={"Origin": origin})
    return response.headers.get("access-control-allow-origin")


@pytest.mark.anyio
@pytest.mark.parametrize("origin", [
    "http://localhost:3000", "http://localhost:3001", "http://localhost:5173",
    "http://127.0.0.1:3001", "http://localhost",
])
async def test_unset_allows_localhost_on_any_port(origin):
    assert await _allowed_origin(_app(None), origin) == origin


@pytest.mark.anyio
@pytest.mark.parametrize("origin", [
    "https://evil.example", "http://localhost.evil.example", "http://evil.example:3000",
    "http://localhost:3000.evil.example", "ftp://localhost:3000",
])
async def test_unset_does_not_allow_other_sites(origin):
    assert await _allowed_origin(_app(None), origin) is None


@pytest.mark.anyio
async def test_configured_origins_are_used_exactly():
    app = _app("https://reviewlens.example, http://localhost:3000")

    assert await _allowed_origin(app, "https://reviewlens.example") == "https://reviewlens.example"
    assert await _allowed_origin(app, "http://localhost:3000") == "http://localhost:3000"
    # configuring origins turns the localhost-any-port default off
    assert await _allowed_origin(app, "http://localhost:3001") is None


def test_blank_configuration_falls_back_to_the_default():
    assert "allow_origin_regex" in cors_settings("  , ")
    assert cors_settings("https://a.example") == {"allow_origins": ["https://a.example"]}


def test_default_pattern_helper():
    assert is_allowed_by_default("http://localhost:3001")
    assert not is_allowed_by_default("http://localhost.evil.example")
