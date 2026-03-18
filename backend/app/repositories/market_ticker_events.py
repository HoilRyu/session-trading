from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.market_ticker_event import MarketTickerEvent


@dataclass(slots=True)
class TickerEventWrite:
    event_time: datetime
    received_at: datetime
    exchange_id: int
    market_listing_id: int
    raw_symbol: str
    trade_price: Decimal
    signed_change_rate: Decimal | None
    acc_trade_volume_24h: Decimal | None
    source_payload: dict
    acc_trade_price_24h: Decimal | None = None


class MarketTickerEventRepository:
    async def insert_ticker_events(
        self,
        session: AsyncSession,
        rows: list[TickerEventWrite],
    ) -> None:
        if not rows:
            return

        deduplicated_rows = _deduplicate_ticker_event_rows(rows)
        statement = insert(MarketTickerEvent).values(
            [
                {
                    "event_time": row.event_time,
                    "received_at": row.received_at,
                    "exchange_id": row.exchange_id,
                    "market_listing_id": row.market_listing_id,
                    "raw_symbol": row.raw_symbol,
                    "trade_price": row.trade_price,
                    "signed_change_rate": row.signed_change_rate,
                    "acc_trade_volume_24h": row.acc_trade_volume_24h,
                    "source_payload": row.source_payload,
                }
                for row in deduplicated_rows
            ]
        )
        await session.execute(
            statement.on_conflict_do_nothing(
                index_elements=["event_time", "market_listing_id", "received_at"]
            )
        )


def _deduplicate_ticker_event_rows(
    rows: list[TickerEventWrite],
) -> list[TickerEventWrite]:
    seen_keys: set[tuple[datetime, int, datetime]] = set()
    deduplicated_rows: list[TickerEventWrite] = []
    for row in rows:
        row_key = (row.event_time, row.market_listing_id, row.received_at)
        if row_key in seen_keys:
            continue
        seen_keys.add(row_key)
        deduplicated_rows.append(row)
    return deduplicated_rows


market_ticker_event_repository = MarketTickerEventRepository()
