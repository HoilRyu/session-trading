from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app, create_app


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


def test_app_startup_can_auto_start_and_stop_ticker_stream_when_enabled(monkeypatch) -> None:
    class FakeStreamService:
        def __init__(self) -> None:
            self.start_calls = 0
            self.stop_calls = 0
            self.running = False

        async def start_ticker_stream(self):
            self.start_calls += 1
            self.running = True
            return None

        async def stop_ticker_stream(self):
            self.stop_calls += 1
            self.running = False
            return None

        def get_ticker_stream_status(self):
            return SimpleNamespace(running=self.running)

    async def fake_ping_database() -> None:
        return None

    stream_service = FakeStreamService()
    stream_services = {
        "upbit": stream_service,
        "bithumb": FakeStreamService(),
        "binance": FakeStreamService(),
    }

    monkeypatch.setattr(
        "app.main.ping_database",
        fake_ping_database,
        raising=False,
    )
    monkeypatch.setattr(
        "app.api.routes.health.ping_database",
        fake_ping_database,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_market_data_stream_service",
        lambda exchange_code="upbit": stream_services[exchange_code],
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: SimpleNamespace(
            app_name="session-trading-backend",
            cors_allowed_origins=[
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ],
            api_v1_prefix="",
            upbit_ticker_auto_start=True,
            bithumb_ticker_auto_start=False,
            binance_ticker_auto_start=False,
        ),
        raising=False,
    )

    application = create_app()

    with TestClient(application) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert stream_service.start_calls == 1
    assert stream_service.stop_calls == 1


def test_app_startup_uses_persisted_ops_settings_for_market_sync_and_auto_start(monkeypatch) -> None:
    class FakeStreamService:
        def __init__(self) -> None:
            self.start_calls = 0
            self.stop_calls = 0
            self.running = False

        async def start_ticker_stream(self):
            self.start_calls += 1
            self.running = True
            return None

        async def stop_ticker_stream(self):
            self.stop_calls += 1
            self.running = False
            return None

        def get_ticker_stream_status(self):
            return SimpleNamespace(running=self.running)

    class FakeSession:
        def __init__(self) -> None:
            self.commit_calls = 0

        async def commit(self) -> None:
            self.commit_calls += 1

    class FakeSessionManager:
        def __init__(self, session: FakeSession) -> None:
            self.session = session

        async def __aenter__(self) -> FakeSession:
            return self.session

        async def __aexit__(self, exc_type, exc, tb) -> bool:
            return False

    class FakeMarketSyncService:
        def __init__(self) -> None:
            self.enqueue_calls = 0
            self.run_calls: list[object] = []

        async def enqueue_market_sync(self):
            self.enqueue_calls += 1
            return SimpleNamespace(run_id=uuid4())

        async def run_market_sync(self, run_id):
            self.run_calls.append(run_id)

    async def fake_ping_database() -> None:
        return None

    async def fake_get_startup_ops_settings(session, env_settings=None):
        return {
            "market_sync_on_boot": True,
            "exchanges": {
                "upbit": {"auto_start": True, "ticker_enabled": True},
                "bithumb": {"auto_start": False, "ticker_enabled": True},
                "binance": {"auto_start": True, "ticker_enabled": True},
            },
        }

    fake_session = FakeSession()
    fake_market_sync_service = FakeMarketSyncService()
    stream_services = {
        "upbit": FakeStreamService(),
        "bithumb": FakeStreamService(),
        "binance": FakeStreamService(),
    }

    monkeypatch.setattr(
        "app.main.ping_database",
        fake_ping_database,
        raising=False,
    )
    monkeypatch.setattr(
        "app.api.routes.health.ping_database",
        fake_ping_database,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.SessionLocal",
        lambda: FakeSessionManager(fake_session),
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_startup_ops_settings",
        fake_get_startup_ops_settings,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_market_catalog_sync_service",
        lambda: fake_market_sync_service,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_market_data_stream_service",
        lambda exchange_code="upbit": stream_services[exchange_code],
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: SimpleNamespace(
            app_name="session-trading-backend",
            cors_allowed_origins=[
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ],
            api_v1_prefix="",
        ),
        raising=False,
    )

    application = create_app()

    with TestClient(application) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert fake_session.commit_calls == 1
    assert fake_market_sync_service.enqueue_calls == 1
    assert len(fake_market_sync_service.run_calls) == 1
    assert stream_services["upbit"].start_calls == 1
    assert stream_services["upbit"].stop_calls == 1
    assert stream_services["bithumb"].start_calls == 0
    assert stream_services["binance"].start_calls == 1
    assert stream_services["binance"].stop_calls == 1


def test_app_startup_skips_auto_start_when_ticker_is_disabled(monkeypatch) -> None:
    class FakeStreamService:
        def __init__(self) -> None:
            self.start_calls = 0
            self.stop_calls = 0
            self.running = False

        async def start_ticker_stream(self):
            self.start_calls += 1
            self.running = True
            return None

        async def stop_ticker_stream(self):
            self.stop_calls += 1
            self.running = False
            return None

        def get_ticker_stream_status(self):
            return SimpleNamespace(running=self.running)

    class FakeSession:
        async def commit(self) -> None:
            return None

    class FakeSessionManager:
        def __init__(self, session: FakeSession) -> None:
            self.session = session

        async def __aenter__(self) -> FakeSession:
            return self.session

        async def __aexit__(self, exc_type, exc, tb) -> bool:
            return False

    async def fake_ping_database() -> None:
        return None

    async def fake_get_startup_ops_settings(session, env_settings=None):
        return {
            "market_sync_on_boot": False,
            "exchanges": {
                "upbit": {"auto_start": True, "ticker_enabled": True},
                "bithumb": {"auto_start": True, "ticker_enabled": False},
                "binance": {"auto_start": False, "ticker_enabled": True},
            },
        }

    stream_services = {
        "upbit": FakeStreamService(),
        "bithumb": FakeStreamService(),
        "binance": FakeStreamService(),
    }

    monkeypatch.setattr(
        "app.main.ping_database",
        fake_ping_database,
        raising=False,
    )
    monkeypatch.setattr(
        "app.api.routes.health.ping_database",
        fake_ping_database,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.SessionLocal",
        lambda: FakeSessionManager(FakeSession()),
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_startup_ops_settings",
        fake_get_startup_ops_settings,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_market_data_stream_service",
        lambda exchange_code="upbit": stream_services[exchange_code],
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: SimpleNamespace(
            app_name="session-trading-backend",
            cors_allowed_origins=[
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ],
            api_v1_prefix="",
        ),
        raising=False,
    )

    application = create_app()

    with TestClient(application) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert stream_services["upbit"].start_calls == 1
    assert stream_services["bithumb"].start_calls == 0
    assert stream_services["binance"].start_calls == 0
