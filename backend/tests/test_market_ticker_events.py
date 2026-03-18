from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.repositories.market_ticker_events import (
    TickerEventWrite,
    _deduplicate_ticker_event_rows,
)


def build_row(
    *,
    market_listing_id: int,
    seconds: int,
    micros: int = 0,
) -> TickerEventWrite:
    base_time = datetime(2026, 3, 17, 0, 0, tzinfo=UTC)
    event_time = base_time + timedelta(seconds=seconds)
    received_at = event_time + timedelta(microseconds=micros)
    return TickerEventWrite(
        event_time=event_time,
        received_at=received_at,
        exchange_id=1,
        market_listing_id=market_listing_id,
        raw_symbol="KRW-BTC",
        trade_price=Decimal("100"),
        signed_change_rate=Decimal("0.1"),
        acc_trade_volume_24h=Decimal("1000"),
        acc_trade_price_24h=Decimal("2000"),
        source_payload={"received_at": received_at.isoformat()},
    )


def test_deduplicate_ticker_event_rows_drops_exact_duplicate_keys() -> None:
    rows = [
        build_row(market_listing_id=1, seconds=1, micros=1),
        build_row(market_listing_id=1, seconds=1, micros=1),
        build_row(market_listing_id=1, seconds=1, micros=2),
    ]

    deduplicated = _deduplicate_ticker_event_rows(rows)

    assert len(deduplicated) == 2
    assert deduplicated[0].received_at.microsecond == 1
    assert deduplicated[1].received_at.microsecond == 2
