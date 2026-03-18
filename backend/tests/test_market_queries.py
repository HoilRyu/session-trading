from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from types import SimpleNamespace

import pytest
from sqlalchemy.dialects import postgresql

from app.schemas.market_listings import (
    MarketListQueryParams,
    MarketOrderBy,
    MarketOrderDir,
)
from app.repositories.market_queries import MarketQueryRepository


def compile_sql(statement) -> str:
    return str(
        statement.compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )


class FakeSession:
    def __init__(self, *, rows: list[SimpleNamespace], total: int) -> None:
        self.rows = rows
        self.total = total
        self.executed_statements = []
        self.scalar_statements = []

    async def execute(self, statement):
        self.executed_statements.append(statement)
        return self.rows

    async def scalar(self, statement):
        self.scalar_statements.append(statement)
        return self.total


def build_row(
    *,
    market_listing_id: int = 1,
    exchange: str = "upbit",
    raw_symbol: str = "KRW-BTC",
    base_asset: str = "BTC",
    quote_asset: str = "KRW",
    display_name_ko: str | None = "비트코인",
    display_name_en: str | None = "Bitcoin",
    has_warning: bool = False,
    trade_price: str | None = "100.1234",
    signed_change_rate: str | None = "0.0123",
    acc_trade_volume_24h: str | None = "12345.6789",
    acc_trade_price_24h: str | None = "987654321.1234",
) -> SimpleNamespace:
    return SimpleNamespace(
        market_listing_id=market_listing_id,
        exchange=exchange,
        raw_symbol=raw_symbol,
        base_asset=base_asset,
        quote_asset=quote_asset,
        display_name_ko=display_name_ko,
        display_name_en=display_name_en,
        has_warning=has_warning,
        trade_price=Decimal(trade_price) if trade_price is not None else None,
        signed_change_rate=(
            Decimal(signed_change_rate) if signed_change_rate is not None else None
        ),
        acc_trade_volume_24h=(
            Decimal(acc_trade_volume_24h) if acc_trade_volume_24h is not None else None
        ),
        acc_trade_price_24h=(
            Decimal(acc_trade_price_24h) if acc_trade_price_24h is not None else None
        ),
        event_time=datetime(2026, 3, 17, 10, 0, tzinfo=UTC),
    )


@pytest.mark.anyio
async def test_list_markets_returns_active_rows_with_latest_ticker_fields() -> None:
    repository = MarketQueryRepository()
    session = FakeSession(rows=[build_row()], total=1)

    result = await repository.list_markets(session, MarketListQueryParams())

    assert result.total == 1
    assert len(result.items) == 1
    assert result.items[0].exchange == "upbit"
    assert result.items[0].raw_symbol == "KRW-BTC"
    assert result.items[0].trade_price == Decimal("100.1234")
    assert result.items[0].acc_trade_price_24h == Decimal("987654321.1234")

    data_sql = compile_sql(session.executed_statements[0])
    count_sql = compile_sql(session.scalar_statements[0])

    assert "market_listings.is_active IS true" in data_sql
    assert "exchanges.enabled IS true" in data_sql
    assert "LEFT OUTER JOIN latest_market_tickers" in data_sql
    assert "count(*)" in count_sql.lower()


@pytest.mark.anyio
async def test_list_markets_applies_exchange_quote_and_query_filters() -> None:
    repository = MarketQueryRepository()
    session = FakeSession(rows=[build_row()], total=1)
    params = MarketListQueryParams(exchange="upbit", quote="KRW", query="btc")

    await repository.list_markets(session, params)

    data_sql = compile_sql(session.executed_statements[0])

    assert "exchanges.code = 'upbit'" in data_sql
    assert "market_listings.quote_asset = 'KRW'" in data_sql
    assert "ILIKE '%%btc%%'" in data_sql


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("order_by", "order_dir", "expected_fragment"),
    [
        (MarketOrderBy.NAME, None, "ORDER BY coalesce(market_listings.display_name_ko, market_listings.display_name_en, market_listings.base_asset) ASC"),
        (MarketOrderBy.PRICE, None, "ORDER BY latest_market_tickers.trade_price DESC NULLS LAST"),
        (MarketOrderBy.CHANGE_RATE, None, "ORDER BY latest_market_tickers.signed_change_rate DESC NULLS LAST"),
        (MarketOrderBy.VOLUME_24H, MarketOrderDir.ASC, "ORDER BY latest_market_tickers.acc_trade_volume_24h ASC NULLS LAST"),
        (
            MarketOrderBy.TRADE_AMOUNT_24H,
            None,
            "ORDER BY CAST(coalesce(latest_market_tickers.source_payload ->> 'acc_trade_price_24h', latest_market_tickers.source_payload ->> 'atp24h') AS NUMERIC(30, 8)) DESC NULLS LAST",
        ),
    ],
)
async def test_list_markets_applies_supported_sort_orders(
    order_by: MarketOrderBy,
    order_dir: MarketOrderDir | None,
    expected_fragment: str,
) -> None:
    repository = MarketQueryRepository()
    session = FakeSession(rows=[build_row()], total=1)
    params = MarketListQueryParams(order_by=order_by, order_dir=order_dir)

    await repository.list_markets(session, params)

    data_sql = compile_sql(session.executed_statements[0])

    assert expected_fragment in data_sql
    assert "exchanges.code ASC" in data_sql
    assert "market_listings.raw_symbol ASC" in data_sql


@pytest.mark.anyio
async def test_list_markets_applies_start_and_limit_window() -> None:
    repository = MarketQueryRepository()
    session = FakeSession(rows=[build_row(market_listing_id=3)], total=7)
    params = MarketListQueryParams(start=2, limit=2)

    result = await repository.list_markets(session, params)

    assert result.total == 7
    assert result.items[0].market_listing_id == 3

    data_sql = compile_sql(session.executed_statements[0])
    assert " LIMIT 2" in data_sql
    assert " OFFSET 2" in data_sql
