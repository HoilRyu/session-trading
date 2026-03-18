from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.latest_market_ticker import LatestMarketTicker
from app.repositories.market_ticker_events import TickerEventWrite


class LatestMarketTickerRepository:
    async def upsert_latest_tickers(
        self,
        session: AsyncSession,
        rows: list[TickerEventWrite],
    ) -> None:
        if not rows:
            return

        deduplicated_rows = _deduplicate_latest_ticker_rows(rows)

        statement = insert(LatestMarketTicker).values(
            [
                {
                    "market_listing_id": row.market_listing_id,
                    "exchange_id": row.exchange_id,
                    "raw_symbol": row.raw_symbol,
                    "trade_price": row.trade_price,
                    "signed_change_rate": row.signed_change_rate,
                    "acc_trade_volume_24h": row.acc_trade_volume_24h,
                    "event_time": row.event_time,
                    "received_at": row.received_at,
                    "source_payload": row.source_payload,
                }
                for row in deduplicated_rows
            ]
        )
        await session.execute(
            statement.on_conflict_do_update(
                index_elements=["market_listing_id"],
                set_={
                    "exchange_id": statement.excluded.exchange_id,
                    "raw_symbol": statement.excluded.raw_symbol,
                    "trade_price": statement.excluded.trade_price,
                    "signed_change_rate": statement.excluded.signed_change_rate,
                    "acc_trade_volume_24h": statement.excluded.acc_trade_volume_24h,
                    "event_time": statement.excluded.event_time,
                    "received_at": statement.excluded.received_at,
                    "source_payload": statement.excluded.source_payload,
                    "updated_at": func.now(),
                },
            )
        )


def _deduplicate_latest_ticker_rows(
    rows: list[TickerEventWrite],
) -> list[TickerEventWrite]:
    latest_by_market_listing_id: dict[int, TickerEventWrite] = {}
    for row in rows:
        existing = latest_by_market_listing_id.get(row.market_listing_id)
        if existing is None or (row.event_time, row.received_at) >= (
            existing.event_time,
            existing.received_at,
        ):
            latest_by_market_listing_id[row.market_listing_id] = row
    return list(latest_by_market_listing_id.values())


latest_market_ticker_repository = LatestMarketTickerRepository()
