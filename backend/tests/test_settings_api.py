from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.main import app
from app.services.market_data_stream import (
    TickerStreamStatus,
    UnsupportedMarketDataExchangeError,
)


class FakeSession:
    def __init__(self) -> None:
        self.flush_count = 0
        self.commit_count = 0

    async def flush(self) -> None:
        self.flush_count += 1

    async def commit(self) -> None:
        self.commit_count += 1


class FakeSessionManager:
    def __init__(self, session: FakeSession) -> None:
        self._session = session

    async def __aenter__(self) -> FakeSession:
        return self._session

    async def __aexit__(self, exc_type, exc, tb) -> bool:
        return False


class FakeAppSettingRepository:
    def __init__(self) -> None:
        self.values: dict[str, object] = {}

    async def get_setting_by_key(self, session, key: str):
        if key not in self.values:
            return None
        return {"key": key, "value": self.values[key]}

    async def create_setting(self, session, *, key: str, value: object, description: str | None = None):
        self.values[key] = value
        return {"key": key, "value": value, "description": description}

    async def set_setting(self, session, *, key: str, value: object, description: str | None = None):
        self.values[key] = value
        return {"key": key, "value": value, "description": description}


class FakeStreamService:
    def __init__(self, *, exchange: str, running: bool = True) -> None:
        self._status = TickerStreamStatus(
            stream="ticker",
            exchange=exchange,
            running=running,
            subscribed_market_count=3,
            buffered_event_count=1,
            last_received_at=datetime(2026, 3, 18, 8, 0, tzinfo=UTC),
            last_flushed_at=datetime(2026, 3, 18, 8, 1, tzinfo=UTC),
            last_error=None,
        )

    def get_ticker_stream_status(self) -> TickerStreamStatus:
        return self._status


def create_client() -> TestClient:
    return TestClient(app)


def configure_fake_settings_store(monkeypatch):
    session = FakeSession()
    repository = FakeAppSettingRepository()
    env_settings = SimpleNamespace(
        environment="local",
        app_name="session-trading-backend",
        api_v1_prefix="",
        upbit_ticker_auto_start=False,
        bithumb_ticker_auto_start=False,
        binance_ticker_auto_start=False,
    )

    async def fake_ping_database() -> None:
        return None

    async def fake_ensure_default_app_settings(*args, **kwargs) -> None:
        return None

    async def fake_get_startup_ops_settings(*args, **kwargs):
        return {
            "market_sync_on_boot": False,
            "exchanges": {
                "upbit": {"auto_start": False, "ticker_enabled": True},
                "bithumb": {"auto_start": False, "ticker_enabled": True},
                "binance": {"auto_start": False, "ticker_enabled": True},
            },
        }

    monkeypatch.setattr(
        "app.repositories.app_settings.app_setting_repository",
        repository,
        raising=False,
    )
    monkeypatch.setattr(
        "app.api.routes.settings.SessionLocal",
        lambda: FakeSessionManager(session),
        raising=False,
    )
    monkeypatch.setattr(
        "app.api.routes.settings.get_settings",
        lambda: env_settings,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.SessionLocal",
        lambda: FakeSessionManager(session),
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.ping_database",
        fake_ping_database,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.ensure_default_app_settings",
        fake_ensure_default_app_settings,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_startup_ops_settings",
        fake_get_startup_ops_settings,
        raising=False,
    )
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: env_settings,
        raising=False,
    )
    return session, repository


def test_get_settings_returns_seeded_settings_document(monkeypatch) -> None:
    session, repository = configure_fake_settings_store(monkeypatch)

    client = create_client()
    response = client.get("/api/v1/settings")

    assert response.status_code == 200
    assert response.json()["general"]["default_exchange"] == "upbit"
    assert response.json()["market_data"]["default_quote"] == "KRW"
    assert response.json()["chart"]["default_symbol"] == "KRW-BTC"
    assert response.json()["ops"]["exchanges"]["binance"]["ticker_enabled"] is True
    assert session.flush_count >= 1
    assert session.commit_count == 1
    assert "general.default_exchange" in repository.values


def test_patch_settings_updates_requested_fields(monkeypatch) -> None:
    session, repository = configure_fake_settings_store(monkeypatch)

    client = create_client()
    response = client.patch(
        "/api/v1/settings",
        json={
            "general": {"default_exchange": "binance"},
            "market_data": {"default_quote": "USDT", "poll_interval_ms": 2000},
            "chart": {
                "default_exchange": "binance",
                "default_symbol": "BTCUSDT",
                "default_interval": "240",
            },
            "ops": {
                "market_sync_on_boot": True,
                "exchanges": {
                    "binance": {"auto_start": True},
                    "bithumb": {"ticker_enabled": False},
                },
            },
        },
    )

    assert response.status_code == 200
    assert response.json()["general"]["default_exchange"] == "binance"
    assert response.json()["market_data"]["default_quote"] == "USDT"
    assert response.json()["chart"]["default_symbol"] == "BTCUSDT"
    assert response.json()["ops"]["exchanges"]["binance"] == {
        "auto_start": True,
        "ticker_enabled": True,
    }
    assert response.json()["ops"]["exchanges"]["bithumb"] == {
        "auto_start": False,
        "ticker_enabled": False,
    }
    assert repository.values["bithumb.ticker.enabled"] is False
    assert session.commit_count == 1


def test_patch_settings_rejects_invalid_payload(monkeypatch) -> None:
    configure_fake_settings_store(monkeypatch)

    client = create_client()

    invalid_poll = client.patch(
        "/api/v1/settings",
        json={"market_data": {"poll_interval_ms": 999}},
    )
    invalid_quote = client.patch(
        "/api/v1/settings",
        json={
            "general": {"default_exchange": "bithumb"},
            "market_data": {"default_quote": "USDT"},
        },
    )
    invalid_page_size = client.patch(
        "/api/v1/settings",
        json={"market_data": {"page_size": 101}},
    )
    invalid_interval = client.patch(
        "/api/v1/settings",
        json={"chart": {"default_interval": "2"}},
    )
    invalid_symbol = client.patch(
        "/api/v1/settings",
        json={
            "chart": {
                "default_exchange": "binance",
                "default_symbol": "KRW-BTC",
            }
        },
    )
    invalid_auto_start = client.patch(
        "/api/v1/settings",
        json={
            "ops": {
                "exchanges": {
                    "binance": {
                        "auto_start": True,
                        "ticker_enabled": False,
                    }
                }
            }
        },
    )
    invalid_chart_exchange = client.patch(
        "/api/v1/settings",
        json={
            "general": {"default_exchange": "binance"},
            "market_data": {"default_quote": "USDT"},
            "chart": {"default_exchange": "upbit"},
        },
    )
    invalid_chart_symbol_quote = client.patch(
        "/api/v1/settings",
        json={
            "general": {"default_exchange": "binance"},
            "market_data": {"default_quote": "BTC"},
            "chart": {
                "default_exchange": "binance",
                "default_symbol": "BTCUSDT",
            },
        },
    )
    invalid_nested_typo = client.patch(
        "/api/v1/settings",
        json={
            "market_data": {
                "exchanges": {
                    "upbit": {
                        "enabeld": False,
                    }
                }
            }
        },
    )

    assert invalid_poll.status_code == 400
    assert invalid_quote.status_code == 400
    assert invalid_page_size.status_code == 400
    assert invalid_interval.status_code == 400
    assert invalid_symbol.status_code == 400
    assert invalid_auto_start.status_code == 400
    assert invalid_chart_exchange.status_code == 400
    assert invalid_chart_symbol_quote.status_code == 400
    assert invalid_nested_typo.status_code == 422


def test_reset_settings_restores_requested_section_only(monkeypatch) -> None:
    configure_fake_settings_store(monkeypatch)
    client = create_client()

    patch_response = client.patch(
        "/api/v1/settings",
        json={
            "market_data": {"poll_interval_ms": 4000},
            "chart": {"theme": "dark"},
        },
    )
    assert patch_response.status_code == 200

    reset_response = client.post("/api/v1/settings/reset", json={"section": "chart"})
    invalid_reset_response = client.post("/api/v1/settings/reset", json={"section": "ops"})
    invalid_full_reset_response = client.post(
        "/api/v1/settings/reset",
        json={"section": "all"},
    )

    assert reset_response.status_code == 200
    assert reset_response.json()["chart"]["theme"] == "light"
    assert reset_response.json()["market_data"]["poll_interval_ms"] == 4000
    assert invalid_reset_response.status_code == 400
    assert invalid_full_reset_response.status_code == 400


def test_get_settings_runtime_returns_exchange_statuses(monkeypatch) -> None:
    configure_fake_settings_store(monkeypatch)

    stream_services = {
        "upbit": FakeStreamService(exchange="upbit"),
        "bithumb": FakeStreamService(exchange="bithumb", running=False),
        "binance": FakeStreamService(exchange="binance"),
    }

    async def fake_ping_database() -> None:
        return None

    monkeypatch.setattr(
        "app.api.routes.settings.ping_database",
        fake_ping_database,
        raising=False,
    )
    monkeypatch.setattr(
        "app.api.routes.settings.get_market_data_stream_service",
        lambda exchange: stream_services[exchange],
        raising=False,
    )

    client = create_client()
    response = client.get("/api/v1/settings/runtime")

    assert response.status_code == 200
    assert response.json() == {
        "environment": "local",
        "backend_status": "online",
        "target": "http://testserver",
        "exchanges": {
            "upbit": {
                "status": "running",
                "subscribed_market_count": 3,
                "buffered_event_count": 1,
                "last_received_at": "2026-03-18T08:00:00Z",
                "last_flushed_at": "2026-03-18T08:01:00Z",
                "last_error": None,
            },
            "bithumb": {
                "status": "stopped",
                "subscribed_market_count": 3,
                "buffered_event_count": 1,
                "last_received_at": "2026-03-18T08:00:00Z",
                "last_flushed_at": "2026-03-18T08:01:00Z",
                "last_error": None,
            },
            "binance": {
                "status": "running",
                "subscribed_market_count": 3,
                "buffered_event_count": 1,
                "last_received_at": "2026-03-18T08:00:00Z",
                "last_flushed_at": "2026-03-18T08:01:00Z",
                "last_error": None,
            },
        },
    }


def test_get_settings_runtime_tolerates_partial_exchange_failures(monkeypatch) -> None:
    configure_fake_settings_store(monkeypatch)

    async def fake_ping_database() -> None:
        return None

    monkeypatch.setattr(
        "app.api.routes.settings.ping_database",
        fake_ping_database,
        raising=False,
    )
    def fake_service(exchange: str):
        if exchange == "bithumb":
            raise UnsupportedMarketDataExchangeError("지원하지 않는 거래소입니다: bithumb")
        return FakeStreamService(exchange=exchange)

    monkeypatch.setattr(
        "app.api.routes.settings.get_market_data_stream_service",
        fake_service,
        raising=False,
    )

    client = create_client()
    response = client.get("/api/v1/settings/runtime")

    assert response.status_code == 200
    assert response.json()["exchanges"]["bithumb"] == {
        "status": "unavailable",
        "subscribed_market_count": 0,
        "buffered_event_count": 0,
        "last_received_at": None,
        "last_flushed_at": None,
        "last_error": "지원하지 않는 거래소입니다: bithumb",
    }
