from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy.dialects import postgresql

from app.repositories.latest_market_tickers import LatestMarketTickerRepository
from app.repositories.latest_market_tickers import _deduplicate_latest_ticker_rows
from app.repositories.market_ticker_events import TickerEventWrite


def build_row(*, market_listing_id: int, seconds: int, trade_price: str) -> TickerEventWrite:
    base_time = datetime(2026, 3, 17, 0, 0, tzinfo=UTC)
    timestamp = base_time + timedelta(seconds=seconds)
    return TickerEventWrite(
        event_time=timestamp,
        received_at=timestamp,
        exchange_id=1,
        market_listing_id=market_listing_id,
        raw_symbol="KRW-BTC",
        trade_price=Decimal(trade_price),
        signed_change_rate=Decimal("0.1"),
        acc_trade_volume_24h=Decimal("1000"),
        acc_trade_price_24h=Decimal("2000"),
        source_payload={"trade_price": trade_price},
    )


class FakeSession:
    def __init__(self) -> None:
        self.statement = None

    async def execute(self, statement) -> None:
        self.statement = statement


def test_deduplicate_latest_ticker_rows_keeps_latest_row_per_market() -> None:
    rows = [
        build_row(market_listing_id=1, seconds=1, trade_price="100"),
        build_row(market_listing_id=1, seconds=2, trade_price="101"),
        build_row(market_listing_id=2, seconds=1, trade_price="200"),
    ]

    deduplicated = _deduplicate_latest_ticker_rows(rows)

    assert len(deduplicated) == 2
    assert deduplicated[0].market_listing_id == 1
    assert deduplicated[0].trade_price == Decimal("101")
    assert deduplicated[1].market_listing_id == 2


@pytest.mark.anyio
async def test_upsert_latest_tickers_refreshes_updated_at_on_conflict() -> None:
    session = FakeSession()
    repository = LatestMarketTickerRepository()

    await repository.upsert_latest_tickers(
        session,
        [build_row(market_listing_id=1, seconds=1, trade_price="100")],
    )

    assert session.statement is not None
    compiled = str(session.statement.compile(dialect=postgresql.dialect()))

    assert "updated_at = now()" in compiled.lower()
