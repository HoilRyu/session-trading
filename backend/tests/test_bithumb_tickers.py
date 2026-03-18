from __future__ import annotations

import pytest

from app.integrations.exchanges.bithumb.tickers import BithumbTickerSnapshotFetcher


class StubClient:
    def __init__(self, responses: list[list[dict]]) -> None:
        self.responses = responses
        self.calls: list[tuple[str, dict]] = []

    async def get_json(self, path: str, params: dict | None = None):
        self.calls.append((path, params or {}))
        return self.responses[len(self.calls) - 1]


@pytest.mark.anyio
async def test_fetch_ticker_snapshots_batches_long_market_lists(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        "app.integrations.exchanges.bithumb.tickers.TICKER_SNAPSHOT_BATCH_SIZE",
        2,
    )
    client = StubClient(
        responses=[
            [
                {"market": "KRW-BTC", "trade_price": "1"},
                {"market": "KRW-ETH", "trade_price": "2"},
            ],
            [
                {"market": "BTC-XRP", "trade_price": "3"},
                {"market": "BTC-IGNORED", "trade_price": "4"},
            ],
        ]
    )
    fetcher = BithumbTickerSnapshotFetcher(client=client)

    snapshots = await fetcher.fetch_ticker_snapshots(
        ["KRW-BTC", "KRW-ETH", "BTC-XRP"]
    )

    assert client.calls == [
        ("/v1/ticker", {"markets": "KRW-BTC,KRW-ETH"}),
        ("/v1/ticker", {"markets": "BTC-XRP"}),
    ]
    assert snapshots == [
        {"market": "KRW-BTC", "trade_price": "1"},
        {"market": "KRW-ETH", "trade_price": "2"},
        {"market": "BTC-XRP", "trade_price": "3"},
    ]


@pytest.mark.anyio
async def test_fetch_ticker_snapshots_returns_empty_list_when_no_codes():
    fetcher = BithumbTickerSnapshotFetcher(client=StubClient(responses=[]))

    snapshots = await fetcher.fetch_ticker_snapshots([])

    assert snapshots == []
