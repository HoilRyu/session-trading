from __future__ import annotations

import pytest

from app.integrations.exchanges.binance.tickers import (
    BinanceTickerSnapshotFetcher,
    serialize_ticker_symbols,
)


class StubClient:
    def __init__(self, responses: list[list[dict]]) -> None:
        self.responses = responses
        self.calls: list[tuple[str, dict]] = []

    async def get_json(self, path: str, params: dict | None = None):
        self.calls.append((path, params or {}))
        return self.responses[len(self.calls) - 1]


def test_serialize_ticker_symbols_uses_compact_json() -> None:
    assert serialize_ticker_symbols(["BTCUSDT", "ETHBTC"]) == '["BTCUSDT","ETHBTC"]'


@pytest.mark.anyio
async def test_fetch_ticker_snapshots_batches_long_market_lists(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        "app.integrations.exchanges.binance.tickers.TICKER_SNAPSHOT_BATCH_SIZE",
        2,
    )
    client = StubClient(
        responses=[
            [
                {"symbol": "BTCUSDT", "lastPrice": "74000"},
                {"symbol": "ETHBTC", "lastPrice": "0.05"},
            ],
            [
                {"symbol": "SOLBTC", "lastPrice": "0.0018"},
                {"symbol": "IGNORED", "lastPrice": "1"},
            ],
        ]
    )
    fetcher = BinanceTickerSnapshotFetcher(client=client)

    snapshots = await fetcher.fetch_ticker_snapshots(
        ["USDT-BTC", "BTC-ETH", "BTC-SOL"]
    )

    assert client.calls == [
        ("/api/v3/ticker/24hr", {"symbols": '["BTCUSDT","ETHBTC"]'}),
        ("/api/v3/ticker/24hr", {"symbols": '["SOLBTC"]'}),
    ]
    assert snapshots == [
        {"symbol": "BTCUSDT", "lastPrice": "74000", "raw_symbol": "USDT-BTC"},
        {"symbol": "ETHBTC", "lastPrice": "0.05", "raw_symbol": "BTC-ETH"},
        {"symbol": "SOLBTC", "lastPrice": "0.0018", "raw_symbol": "BTC-SOL"},
    ]


@pytest.mark.anyio
async def test_fetch_ticker_snapshots_returns_empty_list_when_no_codes():
    fetcher = BinanceTickerSnapshotFetcher(client=StubClient(responses=[]))

    snapshots = await fetcher.fetch_ticker_snapshots([])

    assert snapshots == []
