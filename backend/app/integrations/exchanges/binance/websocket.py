from __future__ import annotations

import json
from collections.abc import AsyncIterator

import websockets

from app.core.config import get_settings
from app.integrations.exchanges.binance.normalizers import to_binance_exchange_symbol

MINI_TICKER_STREAM_NAME = "!miniTicker@arr"


def build_active_symbol_map(codes: list[str]) -> dict[str, str]:
    return {to_binance_exchange_symbol(code): code for code in codes}


def resolve_websocket_url(websocket_url: str) -> str:
    if websocket_url.endswith(MINI_TICKER_STREAM_NAME):
        return websocket_url
    return f"{websocket_url.rstrip('/')}/ws/{MINI_TICKER_STREAM_NAME}"


async def connect_and_stream(
    codes: list[str],
    *,
    use_simple_format: bool = False,
    websocket_url: str | None = None,
) -> AsyncIterator[dict]:
    del use_simple_format

    if not codes:
        raise ValueError("바이낸스 ticker 구독 마켓이 없습니다.")

    settings = get_settings()
    active_symbols = build_active_symbol_map(codes)

    async with websockets.connect(
        resolve_websocket_url(websocket_url or settings.binance_websocket_url)
    ) as connection:
        async for message in connection:
            payload = json.loads(message if isinstance(message, str) else message.decode("utf-8"))
            if not isinstance(payload, list):
                continue

            for item in payload:
                symbol = str(item.get("s", "")).upper()
                raw_symbol = active_symbols.get(symbol)
                if raw_symbol is None:
                    continue
                yield {**item, "raw_symbol": raw_symbol}
