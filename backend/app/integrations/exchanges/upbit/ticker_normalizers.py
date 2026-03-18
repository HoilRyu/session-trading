from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.integrations.exchanges.base.models import NormalizedTickerMessage


def normalize_rest_ticker_snapshot(payload: dict[str, Any]) -> NormalizedTickerMessage:
    raw_symbol = _first_value(payload, "market", "code", "cd")
    trade_price = _first_value(payload, "trade_price", "tp")
    signed_change_rate = _first_value(payload, "signed_change_rate", "scr")
    acc_trade_volume_24h = _first_value(payload, "acc_trade_volume_24h", "atv")
    acc_trade_price_24h = _first_value(payload, "acc_trade_price_24h", "atp24h")
    event_timestamp = _first_value(payload, "trade_timestamp", "ttms", "timestamp", "tms")

    if raw_symbol is None or trade_price is None or event_timestamp is None:
        raise ValueError("업비트 REST ticker payload에 필수 필드가 없습니다.")

    return NormalizedTickerMessage(
        raw_symbol=str(raw_symbol),
        trade_price=float(trade_price),
        signed_change_rate=(
            float(signed_change_rate) if signed_change_rate is not None else None
        ),
        acc_trade_volume_24h=(
            float(acc_trade_volume_24h) if acc_trade_volume_24h is not None else None
        ),
        event_time=datetime.fromtimestamp(float(event_timestamp) / 1000, tz=UTC),
        received_at=datetime.now(UTC),
        source_payload=payload,
        acc_trade_price_24h=(
            float(acc_trade_price_24h) if acc_trade_price_24h is not None else None
        ),
    )


def normalize_ticker_message(payload: dict[str, Any]) -> NormalizedTickerMessage:
    raw_symbol = _first_value(payload, "code", "cd")
    trade_price = _first_value(payload, "trade_price", "tp")
    signed_change_rate = _first_value(payload, "signed_change_rate", "scr")
    acc_trade_volume_24h = _first_value(payload, "acc_trade_volume_24h", "atv")
    acc_trade_price_24h = _first_value(payload, "acc_trade_price_24h", "atp24h")
    event_timestamp = _first_value(payload, "trade_timestamp", "ttms", "timestamp", "tms")

    if raw_symbol is None or trade_price is None or event_timestamp is None:
        raise ValueError("업비트 ticker payload에 필수 필드가 없습니다.")

    return NormalizedTickerMessage(
        raw_symbol=str(raw_symbol),
        trade_price=float(trade_price),
        signed_change_rate=(
            float(signed_change_rate) if signed_change_rate is not None else None
        ),
        acc_trade_volume_24h=(
            float(acc_trade_volume_24h) if acc_trade_volume_24h is not None else None
        ),
        event_time=datetime.fromtimestamp(float(event_timestamp) / 1000, tz=UTC),
        received_at=datetime.now(UTC),
        source_payload=payload,
        acc_trade_price_24h=(
            float(acc_trade_price_24h) if acc_trade_price_24h is not None else None
        ),
    )


def _first_value(payload: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in payload:
            return payload[key]
    return None
