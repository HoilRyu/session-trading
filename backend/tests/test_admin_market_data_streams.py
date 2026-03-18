from __future__ import annotations

from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.main import app
from app.services.market_data_stream import (
    MarketDataStreamService,
    TickerStreamStatus,
)
from app.api.routes.admin_market_data_streams import get_ticker_stream_service


class FakeMarketDataStreamService:
    def __init__(self) -> None:
        self.start_called = 0
        self.stop_called = 0
        self.status = TickerStreamStatus(
            stream="ticker",
            exchange="upbit",
            running=True,
            subscribed_market_count=3,
            buffered_event_count=1,
            last_received_at=datetime.now(UTC),
            last_flushed_at=datetime.now(UTC),
            last_error=None,
        )

    async def start_ticker_stream(self) -> TickerStreamStatus:
        self.start_called += 1
        return self.status

    async def stop_ticker_stream(self) -> TickerStreamStatus:
        self.stop_called += 1
        self.status.running = False
        self.status.subscribed_market_count = 0
        self.status.buffered_event_count = 0
        return self.status

    def get_ticker_stream_status(self) -> TickerStreamStatus:
        return self.status


def test_post_ticker_stream_start_returns_202() -> None:
    fake_service = FakeMarketDataStreamService()
    app.dependency_overrides[get_ticker_stream_service] = lambda: fake_service

    client = TestClient(app)
    response = client.post("/admin/market-data-streams/ticker/start")

    app.dependency_overrides.clear()

    assert response.status_code == 202
    assert response.json() == {
        "stream": "ticker",
        "exchange": "upbit",
        "status": "starting",
        "subscribed_market_count": 3,
    }
    assert fake_service.start_called == 1


def test_post_ticker_stream_stop_returns_200() -> None:
    fake_service = FakeMarketDataStreamService()
    app.dependency_overrides[get_ticker_stream_service] = lambda: fake_service

    client = TestClient(app)
    response = client.post("/admin/market-data-streams/ticker/stop")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "stream": "ticker",
        "exchange": "upbit",
        "status": "stopped",
        "subscribed_market_count": 0,
    }
    assert fake_service.stop_called == 1


def test_get_ticker_stream_status_returns_runtime_state() -> None:
    fake_service = FakeMarketDataStreamService()
    app.dependency_overrides[get_ticker_stream_service] = lambda: fake_service

    client = TestClient(app)
    response = client.get("/admin/market-data-streams/ticker/status")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "running"
    assert response.json()["subscribed_market_count"] == 3
    assert response.json()["buffered_event_count"] == 1
    assert response.json()["last_received_at"] is not None


def test_admin_ticker_stream_routes_accept_exchange_query() -> None:
    fake_service = FakeMarketDataStreamService()
    fake_service.status.exchange = "bithumb"
    app.dependency_overrides[get_ticker_stream_service] = lambda: fake_service

    client = TestClient(app)
    response = client.get("/admin/market-data-streams/ticker/status", params={"exchange": "bithumb"})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["exchange"] == "bithumb"
