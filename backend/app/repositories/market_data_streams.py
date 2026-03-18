from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exchange import Exchange
from app.models.market_listing import MarketListing


@dataclass(slots=True)
class MarketSubscription:
    exchange_id: int
    market_listing_id: int
    raw_symbol: str


class MarketDataStreamRepository:
    async def list_active_market_subscriptions(
        self,
        session: AsyncSession,
        exchange_code: str,
        *,
        quote_assets: tuple[str, ...] | None = None,
    ) -> list[MarketSubscription]:
        filters = [
            Exchange.code == exchange_code,
            Exchange.enabled.is_(True),
            MarketListing.market_type == "spot",
            MarketListing.is_active.is_(True),
        ]
        if quote_assets:
            filters.append(MarketListing.quote_asset.in_(quote_assets))

        rows = await session.execute(
            select(
                MarketListing.exchange_id,
                MarketListing.id,
                MarketListing.raw_symbol,
            )
            .join(Exchange, Exchange.id == MarketListing.exchange_id)
            .where(*filters)
            .order_by(MarketListing.raw_symbol.asc())
        )
        return [
            MarketSubscription(
                exchange_id=exchange_id,
                market_listing_id=market_listing_id,
                raw_symbol=raw_symbol,
            )
            for exchange_id, market_listing_id, raw_symbol in rows
        ]

    async def list_active_upbit_market_subscriptions(
        self,
        session: AsyncSession,
    ) -> list[MarketSubscription]:
        return await self.list_active_market_subscriptions(session, "upbit")

    async def list_active_binance_market_subscriptions(
        self,
        session: AsyncSession,
    ) -> list[MarketSubscription]:
        subscriptions = await self.list_active_market_subscriptions(
            session,
            "binance",
            quote_assets=("USDT", "BTC"),
        )
        return [
            subscription
            for subscription in subscriptions
            if _is_ascii_market_symbol(subscription.raw_symbol)
        ]


def _is_ascii_market_symbol(raw_symbol: str) -> bool:
    return raw_symbol.isascii() and raw_symbol.replace("-", "").isalnum()


market_data_stream_repository = MarketDataStreamRepository()
