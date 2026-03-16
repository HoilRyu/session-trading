from fastapi.testclient import TestClient

from app.main import app


def create_client() -> TestClient:
    return TestClient(app)


def test_health_endpoint_returns_service_status(monkeypatch) -> None:
    async def fake_ping_database() -> None:
        return None

    monkeypatch.setattr(
        "app.api.routes.health.ping_database",
        fake_ping_database,
        raising=False,
    )

    client = create_client()
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "session-trading-backend",
        "environment": "local",
        "database": "ok",
    }


def test_health_endpoint_returns_503_when_database_is_unavailable(monkeypatch) -> None:
    async def fake_ping_database() -> None:
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(
        "app.api.routes.health.ping_database",
        fake_ping_database,
        raising=False,
    )

    client = create_client()
    response = client.get("/health")

    assert response.status_code == 503
    assert response.json() == {
        "status": "error",
        "service": "session-trading-backend",
        "environment": "local",
        "database": "unavailable",
    }


def test_health_endpoint_allows_local_frontend_origin(monkeypatch) -> None:
    async def fake_ping_database() -> None:
        return None

    monkeypatch.setattr(
        "app.api.routes.health.ping_database",
        fake_ping_database,
        raising=False,
    )

    client = create_client()
    response = client.get(
        "/health",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
