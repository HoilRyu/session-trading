from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import websockets

from app.core.config import get_settings


def to_bithumb_websocket_symbol(raw_symbol: str) -> str:
    quote_asset, base_asset = raw_symbol.split("-", maxsplit=1)
    return f"{base_asset}_{quote_asset}"


def build_ticker_subscribe_payload(
    codes: list[str],
) -> dict[str, Any]:
    return {
        "type": "ticker",
        "symbols": [to_bithumb_websocket_symbol(code) for code in codes],
        "tickTypes": ["24H"],
    }


async def connect_and_stream(
    codes: list[str],
    *,
    use_simple_format: bool = False,
    websocket_url: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    del use_simple_format

    if not codes:
        raise ValueError("빗썸 ticker 구독 마켓이 없습니다.")

    settings = get_settings()
    async with websockets.connect(
        websocket_url or settings.bithumb_websocket_url
    ) as connection:
        await connection.send(
            json.dumps(build_ticker_subscribe_payload(codes))
        )

        async for message in connection:
            payload = json.loads(message if isinstance(message, str) else message.decode("utf-8"))
            if payload.get("type") != "ticker":
                continue
            yield payload
