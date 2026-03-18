from datetime import UTC, datetime
from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app
from app.repositories.market_queries import (
    MarketQueryItem,
    MarketQueryResult,
    get_market_query_repository,
)
from app.schemas.market_listings import (
    MarketListQueryParams,
    MarketOrderBy,
    MarketOrderDir,
)


def test_market_list_query_params_uses_expected_defaults() -> None:
    params = MarketListQueryParams()

    assert params.exchange == "all"
    assert params.quote == "all"
    assert params.query == ""
    assert params.start == 0
    assert params.limit == 50
    assert params.order_by == MarketOrderBy.NAME
    assert params.resolved_order_dir == MarketOrderDir.ASC


def test_market_list_query_params_resolves_desc_order_for_numeric_sort_keys() -> None:
    params = MarketListQueryParams(order_by=MarketOrderBy.PRICE)

    assert params.order_dir is None
    assert params.resolved_order_dir == MarketOrderDir.DESC


class FakeMarketQueryRepository:
    def __init__(self) -> None:
        self.calls: list[MarketListQueryParams] = []

    async def list_markets(self, session, params: MarketListQueryParams) -> MarketQueryResult:
        self.calls.append(params)
        return MarketQueryResult(
            items=[
                MarketQueryItem(
                    market_listing_id=1,
                    exchange="upbit",
                    raw_symbol="KRW-BTC",
                    base_asset="BTC",
                    quote_asset="KRW",
                    display_name_ko="비트코인",
                    display_name_en="Bitcoin",
                    has_warning=False,
                    trade_price=Decimal("100.1234"),
                    signed_change_rate=Decimal("0.0123"),
                    acc_trade_volume_24h=Decimal("12345.6789"),
                    acc_trade_price_24h=Decimal("987654321.1234"),
                    event_time=datetime(2026, 3, 17, 10, 0, tzinfo=UTC),
                )
            ],
            total=1,
            refreshed_at=datetime(2026, 3, 17, 10, 1, tzinfo=UTC),
        )


def test_get_markets_returns_paginated_response_with_defaults() -> None:
    fake_repository = FakeMarketQueryRepository()
    app.dependency_overrides[get_market_query_repository] = lambda: fake_repository

    client = TestClient(app)
    response = client.get("/api/v1/markets")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "start": 0,
        "limit": 50,
        "total": 1,
        "refreshed_at": "2026-03-17T10:01:00Z",
        "items": [
            {
                "market_listing_id": 1,
                "exchange": "upbit",
                "raw_symbol": "KRW-BTC",
                "base_asset": "BTC",
                "quote_asset": "KRW",
                "display_name_ko": "비트코인",
                "display_name_en": "Bitcoin",
                "has_warning": False,
                "trade_price": "100.1234",
                "signed_change_rate": "0.0123",
                "acc_trade_volume_24h": "12345.6789",
                "acc_trade_price_24h": "987654321.1234",
                "event_time": "2026-03-17T10:00:00Z",
            }
        ],
    }
    assert fake_repository.calls[0].exchange == "all"
    assert fake_repository.calls[0].quote == "all"
    assert fake_repository.calls[0].start == 0
    assert fake_repository.calls[0].limit == 50


def test_get_markets_passes_query_parameters_to_repository() -> None:
    fake_repository = FakeMarketQueryRepository()
    app.dependency_overrides[get_market_query_repository] = lambda: fake_repository

    client = TestClient(app)
    response = client.get(
        "/api/v1/markets",
        params={
            "exchange": "upbit",
            "quote": "KRW",
            "query": "btc",
            "order_by": "trade_amount_24h",
            "order_dir": "asc",
            "start": 10,
            "limit": 20,
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert fake_repository.calls[0].exchange == "upbit"
    assert fake_repository.calls[0].quote == "KRW"
    assert fake_repository.calls[0].query == "btc"
    assert fake_repository.calls[0].order_by == MarketOrderBy.TRADE_AMOUNT_24H
    assert fake_repository.calls[0].resolved_order_dir == MarketOrderDir.ASC
    assert fake_repository.calls[0].start == 10
    assert fake_repository.calls[0].limit == 20
