from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(slots=True)
class NormalizedMarketListing:
    market_type: str
    raw_symbol: str
    base_asset: str
    quote_asset: str
    display_name_ko: str | None
    display_name_en: str | None
    availability_status: str
    exchange_status: str | None
    has_warning: bool
    warning_flags: dict[str, Any]
    source_payload: dict[str, Any]


@dataclass(slots=True)
class NormalizedTickerMessage:
    raw_symbol: str
    trade_price: float
    signed_change_rate: float | None
    acc_trade_volume_24h: float | None
    event_time: datetime
    received_at: datetime
    source_payload: dict[str, Any]
    acc_trade_price_24h: float | None = None
