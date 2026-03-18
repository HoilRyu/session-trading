from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from app.integrations.exchanges.base.models import NormalizedMarketListing


def normalize_market(payload: BaseModel | dict[str, Any]) -> NormalizedMarketListing:
    raw_payload = payload.model_dump() if isinstance(payload, BaseModel) else dict(payload)
    raw_symbol = str(raw_payload["market"]).upper()
    quote_asset, base_asset = raw_symbol.split("-", maxsplit=1)

    market_event = raw_payload.get("market_event") or {}
    warning = market_event.get("warning")
    caution = market_event.get("caution") or {}
    warning_flags = {
        "warning": warning,
        "caution": caution,
    }
    has_warning = bool(warning) or any(bool(value) for value in caution.values())

    return NormalizedMarketListing(
        market_type="spot",
        raw_symbol=raw_symbol,
        base_asset=base_asset,
        quote_asset=quote_asset,
        display_name_ko=raw_payload.get("korean_name"),
        display_name_en=raw_payload.get("english_name"),
        availability_status="listed",
        exchange_status=None,
        has_warning=has_warning,
        warning_flags=warning_flags,
        source_payload=raw_payload,
    )
