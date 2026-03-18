from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import websockets

from app.core.config import get_settings


def build_ticker_subscribe_payload(
    codes: list[str],
    use_simple_format: bool,
) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = [
        {"ticket": "session-trading-upbit-ticker"},
        {
            "type": get_settings().upbit_ticker_stream_type,
            "codes": codes,
            "isOnlyRealtime": True,
        },
    ]
    if use_simple_format:
        payload.append({"format": "SIMPLE"})
    return payload


async def connect_and_stream(
    codes: list[str],
    *,
    use_simple_format: bool = True,
    websocket_url: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    if not codes:
        raise ValueError("업비트 ticker 구독 마켓이 없습니다.")

    settings = get_settings()
    async with websockets.connect(websocket_url or settings.upbit_websocket_url) as connection:
        await connection.send(
            json.dumps(
                build_ticker_subscribe_payload(
                    codes,
                    use_simple_format=use_simple_format,
                )
            )
        )

        async for message in connection:
            if isinstance(message, bytes):
                yield json.loads(message.decode("utf-8"))
                continue
            yield json.loads(message)
