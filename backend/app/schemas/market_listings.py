from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class MarketOrderBy(StrEnum):
    NAME = "name"
    PRICE = "price"
    CHANGE_RATE = "change_rate"
    VOLUME_24H = "volume_24h"
    TRADE_AMOUNT_24H = "trade_amount_24h"


class MarketOrderDir(StrEnum):
    ASC = "asc"
    DESC = "desc"


class MarketListQueryParams(BaseModel):
    exchange: str = "all"
    quote: str = "all"
    query: str = ""
    start: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=100)
    order_by: MarketOrderBy = MarketOrderBy.NAME
    order_dir: MarketOrderDir | None = None

    @property
    def resolved_order_dir(self) -> MarketOrderDir:
        if self.order_dir is not None:
            return self.order_dir
        if self.order_by == MarketOrderBy.NAME:
            return MarketOrderDir.ASC
        return MarketOrderDir.DESC


class MarketListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    market_listing_id: int
    exchange: str
    raw_symbol: str
    base_asset: str
    quote_asset: str
    display_name_ko: str | None = None
    display_name_en: str | None = None
    has_warning: bool
    trade_price: Decimal | None = None
    signed_change_rate: Decimal | None = None
    acc_trade_volume_24h: Decimal | None = None
    acc_trade_price_24h: Decimal | None = None
    event_time: datetime | None = None


class MarketListResponse(BaseModel):
    start: int
    limit: int
    total: int
    refreshed_at: datetime
    items: list[MarketListItem]
