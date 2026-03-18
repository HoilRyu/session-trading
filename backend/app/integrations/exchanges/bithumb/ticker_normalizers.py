from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from zoneinfo import ZoneInfo

from app.integrations.exchanges.base.models import NormalizedTickerMessage

KST = ZoneInfo("Asia/Seoul")


def normalize_rest_ticker_snapshot(payload: dict[str, Any]) -> NormalizedTickerMessage:
    raw_symbol = _first_value(payload, "market")
    trade_price = _first_value(payload, "trade_price")
    signed_change_rate = _first_value(payload, "signed_change_rate")
    acc_trade_volume_24h = _first_value(payload, "acc_trade_volume_24h")
    acc_trade_price_24h = _first_value(payload, "acc_trade_price_24h")
    event_timestamp = _first_value(payload, "trade_timestamp", "timestamp")

    if raw_symbol is None or trade_price is None or event_timestamp is None:
        raise ValueError("빗썸 REST ticker payload에 필수 필드가 없습니다.")

    source_payload = dict(payload)
    source_payload["acc_trade_price_24h"] = acc_trade_price_24h
    source_payload["acc_trade_volume_24h"] = acc_trade_volume_24h

    return NormalizedTickerMessage(
        raw_symbol=str(raw_symbol).upper(),
        trade_price=float(trade_price),
        signed_change_rate=(
            float(signed_change_rate) if signed_change_rate is not None else None
        ),
        acc_trade_volume_24h=(
            float(acc_trade_volume_24h) if acc_trade_volume_24h is not None else None
        ),
        event_time=datetime.fromtimestamp(float(event_timestamp) / 1000, tz=UTC),
        received_at=datetime.now(UTC),
        source_payload=source_payload,
        acc_trade_price_24h=(
            float(acc_trade_price_24h) if acc_trade_price_24h is not None else None
        ),
    )


def normalize_ticker_message(payload: dict[str, Any]) -> NormalizedTickerMessage:
    content = payload.get("content") or {}
    raw_symbol = _to_raw_symbol(str(_first_value(content, "symbol")))
    trade_price = _first_value(content, "closePrice")
    previous_close_price = _first_value(content, "prevClosePrice")
    acc_trade_volume_24h = _first_value(content, "volume")
    acc_trade_price_24h = _first_value(content, "value")
    event_time = _parse_event_time(
        _first_value(content, "date"),
        _first_value(content, "time"),
    )

    if raw_symbol is None or trade_price is None or event_time is None:
        raise ValueError("빗썸 ticker payload에 필수 필드가 없습니다.")

    signed_change_rate = None
    if previous_close_price not in (None, 0, "0", "0.0"):
        signed_change_rate = (
            float(trade_price) - float(previous_close_price)
        ) / float(previous_close_price)

    source_payload = dict(payload)
    source_payload["market"] = raw_symbol
    source_payload["acc_trade_price_24h"] = acc_trade_price_24h
    source_payload["acc_trade_volume_24h"] = acc_trade_volume_24h

    return NormalizedTickerMessage(
        raw_symbol=raw_symbol,
        trade_price=float(trade_price),
        signed_change_rate=signed_change_rate,
        acc_trade_volume_24h=(
            float(acc_trade_volume_24h) if acc_trade_volume_24h is not None else None
        ),
        event_time=event_time,
        received_at=datetime.now(UTC),
        source_payload=source_payload,
        acc_trade_price_24h=(
            float(acc_trade_price_24h) if acc_trade_price_24h is not None else None
        ),
    )


def _parse_event_time(date_value: Any, time_value: Any) -> datetime | None:
    if date_value is None or time_value is None:
        return None

    parsed = datetime.strptime(f"{date_value}{time_value}", "%Y%m%d%H%M%S")
    return parsed.replace(tzinfo=KST).astimezone(UTC)


def _to_raw_symbol(symbol: str) -> str | None:
    if not symbol or "_" not in symbol:
        return None
    base_asset, quote_asset = symbol.split("_", maxsplit=1)
    return f"{quote_asset.upper()}-{base_asset.upper()}"


def _first_value(payload: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in payload:
            return payload[key]
    return None
