from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.integrations.exchanges.base.models import NormalizedTickerMessage


def normalize_rest_ticker_snapshot(payload: dict[str, Any]) -> NormalizedTickerMessage:
    return _normalize_payload(
        payload,
        trade_price_key="lastPrice",
        volume_key="volume",
        quote_volume_key="quoteVolume",
        event_time_key="closeTime",
        price_change_percent_key="priceChangePercent",
        open_price_key="openPrice",
    )


def normalize_ticker_message(payload: dict[str, Any]) -> NormalizedTickerMessage:
    return _normalize_payload(
        payload,
        trade_price_key="c",
        volume_key="v",
        quote_volume_key="q",
        event_time_key="E",
        price_change_percent_key=None,
        open_price_key="o",
    )


def _normalize_payload(
    payload: dict[str, Any],
    *,
    trade_price_key: str,
    volume_key: str,
    quote_volume_key: str,
    event_time_key: str,
    price_change_percent_key: str | None,
    open_price_key: str | None,
) -> NormalizedTickerMessage:
    raw_symbol = _first_value(payload, "raw_symbol", "market")
    trade_price = _first_value(payload, trade_price_key)
    acc_trade_volume_24h = _first_value(payload, volume_key)
    acc_trade_price_24h = _first_value(payload, quote_volume_key)
    event_timestamp = _first_value(payload, event_time_key)

    if raw_symbol is None or trade_price is None or event_timestamp is None:
        raise ValueError("바이낸스 ticker payload에 필수 필드가 없습니다.")

    signed_change_rate = _parse_signed_change_rate(
        payload,
        trade_price_key=trade_price_key,
        price_change_percent_key=price_change_percent_key,
        open_price_key=open_price_key,
    )

    source_payload = dict(payload)
    source_payload["market"] = str(raw_symbol).upper()
    source_payload["acc_trade_price_24h"] = acc_trade_price_24h
    source_payload["acc_trade_volume_24h"] = acc_trade_volume_24h

    return NormalizedTickerMessage(
        raw_symbol=str(raw_symbol).upper(),
        trade_price=float(trade_price),
        signed_change_rate=signed_change_rate,
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


def _parse_signed_change_rate(
    payload: dict[str, Any],
    *,
    trade_price_key: str,
    price_change_percent_key: str | None,
    open_price_key: str | None,
) -> float | None:
    if price_change_percent_key is not None:
        price_change_percent = _first_value(payload, price_change_percent_key)
        if price_change_percent is not None:
            return float(price_change_percent) / 100

    if open_price_key is None:
        return None

    open_price = _first_value(payload, open_price_key)
    trade_price = _first_value(payload, trade_price_key)
    if open_price in (None, 0, "0", "0.0") or trade_price is None:
        return None

    return (float(trade_price) - float(open_price)) / float(open_price)


def _first_value(payload: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in payload:
            return payload[key]
    return None
