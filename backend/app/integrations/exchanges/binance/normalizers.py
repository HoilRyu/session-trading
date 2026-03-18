from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from app.integrations.exchanges.base.models import NormalizedMarketListing


def to_binance_raw_symbol(*, base_asset: str, quote_asset: str) -> str:
    return f"{quote_asset.upper()}-{base_asset.upper()}"


def to_binance_exchange_symbol(raw_symbol: str) -> str:
    quote_asset, base_asset = raw_symbol.split("-", maxsplit=1)
    return f"{base_asset.upper()}{quote_asset.upper()}"


def normalize_market(payload: BaseModel | dict[str, Any]) -> NormalizedMarketListing:
    raw_payload = payload.model_dump() if isinstance(payload, BaseModel) else dict(payload)
    base_asset = str(raw_payload["baseAsset"]).upper()
    quote_asset = str(raw_payload["quoteAsset"]).upper()

    return NormalizedMarketListing(
        market_type="spot",
        raw_symbol=to_binance_raw_symbol(
            base_asset=base_asset,
            quote_asset=quote_asset,
        ),
        base_asset=base_asset,
        quote_asset=quote_asset,
        display_name_ko=None,
        display_name_en=base_asset,
        availability_status="listed",
        exchange_status=raw_payload.get("status"),
        has_warning=False,
        warning_flags={},
        source_payload=raw_payload,
    )
