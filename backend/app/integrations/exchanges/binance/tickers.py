from __future__ import annotations

import json

from app.integrations.exchanges.binance.client import BinancePublicClient
from app.integrations.exchanges.binance.normalizers import to_binance_exchange_symbol

TICKER_SNAPSHOT_BATCH_SIZE = 100


def serialize_ticker_symbols(symbols: list[str]) -> str:
    return json.dumps(symbols, separators=(",", ":"))


class BinanceTickerSnapshotFetcher:
    def __init__(self, client: BinancePublicClient | None = None) -> None:
        self._client = client or BinancePublicClient()

    async def fetch_ticker_snapshots(self, codes: list[str]) -> list[dict]:
        if not codes:
            return []

        raw_symbols_by_symbol = {
            to_binance_exchange_symbol(code): code for code in codes
        }
        snapshots: list[dict] = []
        symbols = list(raw_symbols_by_symbol)

        for index in range(0, len(symbols), TICKER_SNAPSHOT_BATCH_SIZE):
            batch = symbols[index : index + TICKER_SNAPSHOT_BATCH_SIZE]
            payload = await self._client.get_json(
                "/api/v3/ticker/24hr",
                params={"symbols": serialize_ticker_symbols(batch)},
            )
            snapshots.extend(
                {
                    **item,
                    "raw_symbol": raw_symbols_by_symbol[symbol],
                }
                for item in payload
                if (symbol := str(item.get("symbol", "")).upper()) in raw_symbols_by_symbol
            )

        return snapshots
