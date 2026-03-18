from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.integrations.exchanges.base.exceptions import ExchangeIntegrationError


class BinancePublicClient:
    def __init__(
        self,
        base_url: str | None = None,
        timeout_sec: float | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        settings = get_settings()
        self._base_url = base_url or settings.binance_api_base_url
        self._timeout_sec = timeout_sec or settings.binance_request_timeout_sec
        self._client = client

    async def get_json(
        self,
        path: str,
        params: dict[str, Any] | None = None,
    ) -> Any:
        try:
            if self._client is not None:
                response = await self._client.get(path, params=params)
            else:
                async with httpx.AsyncClient(
                    base_url=self._base_url,
                    timeout=self._timeout_sec,
                ) as client:
                    response = await client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            raise ExchangeIntegrationError(
                f"failed to fetch binance resource: {path}"
            ) from exc
