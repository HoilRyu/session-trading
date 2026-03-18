from __future__ import annotations

import pytest

from app.integrations.exchanges.binance.markets import BinanceMarketCatalogFetcher


class StubClient:
    def __init__(self, payload: dict) -> None:
        self.payload = payload
        self.calls: list[tuple[str, dict | None]] = []

    async def get_json(self, path: str, params: dict | None = None):
        self.calls.append((path, params))
        return self.payload


@pytest.mark.anyio
async def test_fetch_markets_excludes_non_ascii_symbols() -> None:
    client = StubClient(
        {
            "symbols": [
                {
                    "symbol": "BTCUSDT",
                    "status": "TRADING",
                    "baseAsset": "BTC",
                    "quoteAsset": "USDT",
                    "isSpotTradingAllowed": True,
                },
                {
                    "symbol": "币安人生USDT",
                    "status": "TRADING",
                    "baseAsset": "币安人生",
                    "quoteAsset": "USDT",
                    "isSpotTradingAllowed": True,
                },
            ]
        }
    )
    fetcher = BinanceMarketCatalogFetcher(client=client)

    markets = await fetcher.fetch_markets()

    assert client.calls == [("/api/v3/exchangeInfo", None)]
    assert len(markets) == 1
    assert markets[0].raw_symbol == "USDT-BTC"
