from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.exchanges.base.models import NormalizedMarketListing
from app.models.exchange import Exchange
from app.models.market_listing import MarketListing


@dataclass(slots=True)
class MarketUpsertResult:
    inserted_count: int
    updated_count: int
    seen_symbols: set[str]


class MarketListingRepository:
    async def upsert_market_listings(
        self,
        session: AsyncSession,
        *,
        exchange_id: int,
        market_type: str,
        markets: list[NormalizedMarketListing],
        observed_at: datetime,
    ) -> MarketUpsertResult:
        seen_symbols = {market.raw_symbol for market in markets}
        existing_by_symbol: dict[str, MarketListing] = {}

        if seen_symbols:
            existing_rows = await session.scalars(
                select(MarketListing).where(
                    MarketListing.exchange_id == exchange_id,
                    MarketListing.market_type == market_type,
                    MarketListing.raw_symbol.in_(seen_symbols),
                )
            )
            existing_by_symbol = {row.raw_symbol: row for row in existing_rows}

        inserted_count = 0
        updated_count = 0
        for market in markets:
            listing = existing_by_symbol.get(market.raw_symbol)
            if listing is None:
                listing = MarketListing(
                    exchange_id=exchange_id,
                    market_type=market.market_type,
                    raw_symbol=market.raw_symbol,
                    base_asset=market.base_asset,
                    quote_asset=market.quote_asset,
                    display_name_ko=market.display_name_ko,
                    display_name_en=market.display_name_en,
                    availability_status=market.availability_status,
                    exchange_status=market.exchange_status,
                    has_warning=market.has_warning,
                    warning_flags=market.warning_flags,
                    is_active=True,
                    missing_count=0,
                    first_seen_at=observed_at,
                    last_seen_at=observed_at,
                    inactive_at=None,
                    source_payload=market.source_payload,
                )
                session.add(listing)
                inserted_count += 1
                continue

            listing.base_asset = market.base_asset
            listing.quote_asset = market.quote_asset
            listing.display_name_ko = market.display_name_ko
            listing.display_name_en = market.display_name_en
            listing.availability_status = market.availability_status
            listing.exchange_status = market.exchange_status
            listing.has_warning = market.has_warning
            listing.warning_flags = market.warning_flags
            listing.is_active = True
            listing.missing_count = 0
            listing.last_seen_at = observed_at
            listing.inactive_at = None
            listing.source_payload = market.source_payload
            updated_count += 1

        await session.flush()
        return MarketUpsertResult(
            inserted_count=inserted_count,
            updated_count=updated_count,
            seen_symbols=seen_symbols,
        )

    async def mark_missing_market_listings(
        self,
        session: AsyncSession,
        *,
        exchange: Exchange,
        market_type: str,
        seen_symbols: set[str],
        observed_at: datetime,
    ) -> int:
        statement = select(MarketListing).where(
            MarketListing.exchange_id == exchange.id,
            MarketListing.market_type == market_type,
            MarketListing.is_active.is_(True),
        )
        if seen_symbols:
            statement = statement.where(MarketListing.raw_symbol.not_in(seen_symbols))

        existing_rows = list(await session.scalars(statement))
        deactivated_count = 0
        for listing in existing_rows:
            listing.missing_count += 1
            if listing.missing_count >= exchange.deactivate_after_misses:
                listing.is_active = False
                listing.inactive_at = observed_at
                deactivated_count += 1

        await session.flush()
        return deactivated_count


market_listing_repository = MarketListingRepository()
