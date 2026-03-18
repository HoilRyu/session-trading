from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import Numeric, Select, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exchange import Exchange
from app.models.latest_market_ticker import LatestMarketTicker
from app.models.market_listing import MarketListing
from app.schemas.market_listings import (
    MarketListQueryParams,
    MarketOrderBy,
    MarketOrderDir,
)


@dataclass(slots=True)
class MarketQueryItem:
    market_listing_id: int
    exchange: str
    raw_symbol: str
    base_asset: str
    quote_asset: str
    display_name_ko: str | None
    display_name_en: str | None
    has_warning: bool
    trade_price: Decimal | None
    signed_change_rate: Decimal | None
    acc_trade_volume_24h: Decimal | None
    acc_trade_price_24h: Decimal | None
    event_time: datetime | None


@dataclass(slots=True)
class MarketQueryResult:
    items: list[MarketQueryItem]
    total: int
    refreshed_at: datetime


class MarketQueryRepository:
    def _trade_amount_24h_expression(self):
        payload_value = func.coalesce(
            LatestMarketTicker.source_payload["acc_trade_price_24h"].astext,
            LatestMarketTicker.source_payload["atp24h"].astext,
        )
        return cast(payload_value, Numeric(30, 8))

    async def list_markets(
        self,
        session: AsyncSession,
        params: MarketListQueryParams,
    ) -> MarketQueryResult:
        filters = self._build_filters(params)
        trade_amount_24h = self._trade_amount_24h_expression()

        base_statement = (
            select(
                MarketListing.id.label("market_listing_id"),
                Exchange.code.label("exchange"),
                MarketListing.raw_symbol.label("raw_symbol"),
                MarketListing.base_asset.label("base_asset"),
                MarketListing.quote_asset.label("quote_asset"),
                MarketListing.display_name_ko.label("display_name_ko"),
                MarketListing.display_name_en.label("display_name_en"),
                MarketListing.has_warning.label("has_warning"),
                LatestMarketTicker.trade_price.label("trade_price"),
                LatestMarketTicker.signed_change_rate.label("signed_change_rate"),
                LatestMarketTicker.acc_trade_volume_24h.label("acc_trade_volume_24h"),
                trade_amount_24h.label("acc_trade_price_24h"),
                LatestMarketTicker.event_time.label("event_time"),
            )
            .select_from(MarketListing)
            .join(Exchange, Exchange.id == MarketListing.exchange_id)
            .outerjoin(
                LatestMarketTicker,
                LatestMarketTicker.market_listing_id == MarketListing.id,
            )
            .where(*filters)
        )

        count_statement = select(func.count()).select_from(
            base_statement.with_only_columns(MarketListing.id).order_by(None).subquery()
        )
        total = await session.scalar(count_statement) or 0

        data_statement = (
            base_statement.order_by(*self._build_order_by(params))
            .offset(params.start)
            .limit(params.limit)
        )
        result = await session.execute(data_statement)

        items = [
            MarketQueryItem(
                market_listing_id=row.market_listing_id,
                exchange=row.exchange,
                raw_symbol=row.raw_symbol,
                base_asset=row.base_asset,
                quote_asset=row.quote_asset,
                display_name_ko=row.display_name_ko,
                display_name_en=row.display_name_en,
                has_warning=row.has_warning,
                trade_price=row.trade_price,
                signed_change_rate=row.signed_change_rate,
                acc_trade_volume_24h=row.acc_trade_volume_24h,
                acc_trade_price_24h=row.acc_trade_price_24h,
                event_time=row.event_time,
            )
            for row in result
        ]

        return MarketQueryResult(
            items=items,
            total=total,
            refreshed_at=datetime.now(UTC),
        )

    def _build_filters(self, params: MarketListQueryParams) -> list:
        filters = [
            MarketListing.is_active.is_(True),
            Exchange.enabled.is_(True),
        ]

        if params.exchange != "all":
            filters.append(Exchange.code == params.exchange)

        if params.quote != "all":
            filters.append(MarketListing.quote_asset == params.quote)

        query = params.query.strip()
        if query:
            pattern = f"%{query}%"
            filters.append(
                or_(
                    MarketListing.base_asset.ilike(pattern),
                    MarketListing.display_name_ko.ilike(pattern),
                    MarketListing.display_name_en.ilike(pattern),
                    MarketListing.raw_symbol.ilike(pattern),
                )
            )

        return filters

    def _build_order_by(self, params: MarketListQueryParams) -> list:
        direction = params.resolved_order_dir
        primary = self._primary_order_expression(params.order_by, direction)
        secondary = [Exchange.code.asc(), MarketListing.raw_symbol.asc()]
        return [primary, *secondary]

    def _primary_order_expression(
        self,
        order_by: MarketOrderBy,
        direction: MarketOrderDir,
    ):
        if order_by == MarketOrderBy.NAME:
            expression = func.coalesce(
                MarketListing.display_name_ko,
                MarketListing.display_name_en,
                MarketListing.base_asset,
            )
            return expression.asc() if direction == MarketOrderDir.ASC else expression.desc()

        column_map = {
            MarketOrderBy.PRICE: LatestMarketTicker.trade_price,
            MarketOrderBy.CHANGE_RATE: LatestMarketTicker.signed_change_rate,
            MarketOrderBy.VOLUME_24H: LatestMarketTicker.acc_trade_volume_24h,
            MarketOrderBy.TRADE_AMOUNT_24H: self._trade_amount_24h_expression(),
        }
        expression = column_map[order_by]
        if direction == MarketOrderDir.ASC:
            return expression.asc().nulls_last()
        return expression.desc().nulls_last()


market_query_repository = MarketQueryRepository()


def get_market_query_repository() -> MarketQueryRepository:
    return market_query_repository
