from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import pytest

from app.integrations.exchanges.base.models import NormalizedTickerMessage
from app.repositories.app_settings import UpbitTickerSettings
from app.repositories.market_data_streams import MarketSubscription
from app.services.market_data_stream import (
    MarketDataStreamAlreadyRunningError,
    MarketDataStreamService,
)


class FakeTickerEventRepository:
    def __init__(self) -> None:
        self.rows = []

    async def insert_ticker_events(self, session, rows) -> None:
        self.rows.extend(rows)


class FakeLatestTickerRepository:
    def __init__(self) -> None:
        self.rows = []

    async def upsert_latest_tickers(self, session, rows) -> None:
        self.rows.extend(rows)


def build_settings(
    *,
    batch_size: int = 100,
    flush_interval_ms: int = 60_000,
) -> UpbitTickerSettings:
    return UpbitTickerSettings(
        enabled=True,
        retention_days=3,
        flush_interval_ms=flush_interval_ms,
        batch_size=batch_size,
        use_simple_format=True,
    )


def build_subscription(symbol: str, market_listing_id: int) -> MarketSubscription:
    return MarketSubscription(
        exchange_id=1,
        market_listing_id=market_listing_id,
        raw_symbol=symbol,
    )


def build_message(symbol: str) -> NormalizedTickerMessage:
    now = datetime.now(UTC)
    return NormalizedTickerMessage(
        raw_symbol=symbol,
        trade_price=12345.6,
        signed_change_rate=0.01,
        acc_trade_volume_24h=1000.5,
        event_time=now,
        received_at=now,
        source_payload={"code": symbol},
    )


async def wait_until(predicate, *, timeout: float = 1.0) -> None:
    loop = asyncio.get_running_loop()
    deadline = loop.time() + timeout
    while loop.time() < deadline:
        if predicate():
            return
        await asyncio.sleep(0.01)
    raise AssertionError("조건이 timeout 내에 충족되지 않았습니다.")


@asynccontextmanager
async def fake_session_factory():
    yield object()


def make_stream_factory(messages: list[dict], started_calls: list[tuple[list[str], bool]]):
    async def factory(codes: list[str], *, use_simple_format: bool, websocket_url: str | None = None) -> AsyncIterator[dict]:
        started_calls.append((codes, use_simple_format))
        for message in messages:
            yield message
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            return
        if False:
            yield {}

    return factory


async def empty_bootstrap_fetcher(codes: list[str]) -> list[dict]:
    return []


@pytest.mark.anyio
async def test_start_ticker_stream_reads_active_markets_and_marks_running() -> None:
    started_calls: list[tuple[list[str], bool]] = []
    service = MarketDataStreamService(
        session_factory=fake_session_factory,
        app_setting_seeder=lambda session: None,
        app_setting_reader=lambda session: build_settings(),
        market_data_repository=type(
            "Repo",
            (),
            {
                "list_active_upbit_market_subscriptions": staticmethod(
                    lambda session: [
                        build_subscription("KRW-BTC", 1),
                        build_subscription("KRW-ETH", 2),
                    ]
                )
            },
        )(),
        ticker_event_repository=FakeTickerEventRepository(),
        latest_ticker_repository=FakeLatestTickerRepository(),
        bootstrap_fetcher=empty_bootstrap_fetcher,
        stream_factory=make_stream_factory([], started_calls),
        ticker_normalizer=lambda payload: build_message(payload["code"]),
    )

    status = await service.start_ticker_stream()
    await wait_until(lambda: len(started_calls) == 1)

    assert status.running is True
    assert status.subscribed_market_count == 2
    assert started_calls == [(["KRW-BTC", "KRW-ETH"], True)]

    await service.stop_ticker_stream()


@pytest.mark.anyio
async def test_stop_ticker_stream_flushes_remaining_buffer() -> None:
    started_calls: list[tuple[list[str], bool]] = []
    ticker_event_repository = FakeTickerEventRepository()
    latest_ticker_repository = FakeLatestTickerRepository()
    service = MarketDataStreamService(
        session_factory=fake_session_factory,
        app_setting_seeder=lambda session: None,
        app_setting_reader=lambda session: build_settings(batch_size=100, flush_interval_ms=60_000),
        market_data_repository=type(
            "Repo",
            (),
            {
                "list_active_upbit_market_subscriptions": staticmethod(
                    lambda session: [build_subscription("KRW-BTC", 1)]
                )
            },
        )(),
        ticker_event_repository=ticker_event_repository,
        latest_ticker_repository=latest_ticker_repository,
        bootstrap_fetcher=empty_bootstrap_fetcher,
        stream_factory=make_stream_factory([{"code": "KRW-BTC"}], started_calls),
        ticker_normalizer=lambda payload: build_message(payload["code"]),
    )

    await service.start_ticker_stream()
    await wait_until(lambda: service.get_ticker_stream_status().buffered_event_count == 1)

    status = await service.stop_ticker_stream()

    assert status.running is False
    assert len(ticker_event_repository.rows) == 1
    assert len(latest_ticker_repository.rows) == 1


@pytest.mark.anyio
async def test_start_ticker_stream_flushes_when_batch_size_is_reached() -> None:
    ticker_event_repository = FakeTickerEventRepository()
    latest_ticker_repository = FakeLatestTickerRepository()
    service = MarketDataStreamService(
        session_factory=fake_session_factory,
        app_setting_seeder=lambda session: None,
        app_setting_reader=lambda session: build_settings(batch_size=1),
        market_data_repository=type(
            "Repo",
            (),
            {
                "list_active_upbit_market_subscriptions": staticmethod(
                    lambda session: [build_subscription("KRW-BTC", 1)]
                )
            },
        )(),
        ticker_event_repository=ticker_event_repository,
        latest_ticker_repository=latest_ticker_repository,
        bootstrap_fetcher=empty_bootstrap_fetcher,
        stream_factory=make_stream_factory([{"code": "KRW-BTC"}], []),
        ticker_normalizer=lambda payload: build_message(payload["code"]),
    )

    await service.start_ticker_stream()
    await wait_until(lambda: len(ticker_event_repository.rows) == 1)

    assert len(latest_ticker_repository.rows) == 1
    await service.stop_ticker_stream()


@pytest.mark.anyio
async def test_ticker_stream_flushes_by_interval_while_messages_keep_arriving() -> None:
    ticker_event_repository = FakeTickerEventRepository()
    latest_ticker_repository = FakeLatestTickerRepository()

    async def endless_stream_factory(
        codes: list[str],
        *,
        use_simple_format: bool,
        websocket_url: str | None = None,
    ) -> AsyncIterator[dict]:
        while True:
            yield {"code": "KRW-BTC"}

    service = MarketDataStreamService(
        session_factory=fake_session_factory,
        app_setting_seeder=lambda session: None,
        app_setting_reader=lambda session: build_settings(batch_size=10_000, flush_interval_ms=10),
        market_data_repository=type(
            "Repo",
            (),
            {
                "list_active_upbit_market_subscriptions": staticmethod(
                    lambda session: [build_subscription("KRW-BTC", 1)]
                )
            },
        )(),
        ticker_event_repository=ticker_event_repository,
        latest_ticker_repository=latest_ticker_repository,
        bootstrap_fetcher=empty_bootstrap_fetcher,
        stream_factory=endless_stream_factory,
        ticker_normalizer=lambda payload: build_message(payload["code"]),
    )

    await service.start_ticker_stream()
    await wait_until(lambda: len(ticker_event_repository.rows) > 0, timeout=0.5)

    assert len(latest_ticker_repository.rows) > 0
    await service.stop_ticker_stream()


@pytest.mark.anyio
async def test_start_ticker_stream_bootstraps_latest_before_opening_stream() -> None:
    call_order: list[str] = []
    started_calls: list[tuple[list[str], bool]] = []
    latest_ticker_repository = FakeLatestTickerRepository()
    ticker_event_repository = FakeTickerEventRepository()

    async def bootstrap_fetcher(codes: list[str]) -> list[dict]:
        call_order.append("bootstrap")
        assert codes == ["KRW-BTC", "KRW-ETH"]
        return [
            {"market": "KRW-BTC", "trade_price": 100.0},
            {"market": "KRW-ETH", "trade_price": 200.0},
        ]

    async def stream_factory(
        codes: list[str],
        *,
        use_simple_format: bool,
        websocket_url: str | None = None,
    ) -> AsyncIterator[dict]:
        call_order.append("stream")
        started_calls.append((codes, use_simple_format))
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            return
        if False:
            yield {}

    service = MarketDataStreamService(
        session_factory=fake_session_factory,
        app_setting_seeder=lambda session: None,
        app_setting_reader=lambda session: build_settings(),
        market_data_repository=type(
            "Repo",
            (),
            {
                "list_active_upbit_market_subscriptions": staticmethod(
                    lambda session: [
                        build_subscription("KRW-BTC", 1),
                        build_subscription("KRW-ETH", 2),
                    ]
                )
            },
        )(),
        ticker_event_repository=ticker_event_repository,
        latest_ticker_repository=latest_ticker_repository,
        bootstrap_fetcher=bootstrap_fetcher,
        bootstrap_ticker_normalizer=lambda payload: build_message(payload["market"]),
        stream_factory=stream_factory,
        ticker_normalizer=lambda payload: build_message(payload["code"]),
    )

    await service.start_ticker_stream()
    await wait_until(lambda: len(started_calls) == 1)

    assert call_order[:2] == ["bootstrap", "stream"]
    assert len(latest_ticker_repository.rows) == 2
    assert ticker_event_repository.rows == []

    await service.stop_ticker_stream()


@pytest.mark.anyio
async def test_start_ticker_stream_raises_when_bootstrap_fails() -> None:
    started_calls: list[tuple[list[str], bool]] = []

    async def bootstrap_fetcher(codes: list[str]) -> list[dict]:
        raise RuntimeError("bootstrap failed")

    service = MarketDataStreamService(
        session_factory=fake_session_factory,
        app_setting_seeder=lambda session: None,
        app_setting_reader=lambda session: build_settings(),
        market_data_repository=type(
            "Repo",
            (),
            {
                "list_active_upbit_market_subscriptions": staticmethod(
                    lambda session: [build_subscription("KRW-BTC", 1)]
                )
            },
        )(),
        ticker_event_repository=FakeTickerEventRepository(),
        latest_ticker_repository=FakeLatestTickerRepository(),
        bootstrap_fetcher=bootstrap_fetcher,
        bootstrap_ticker_normalizer=lambda payload: build_message(payload["market"]),
        stream_factory=make_stream_factory([], started_calls),
        ticker_normalizer=lambda payload: build_message(payload["code"]),
    )

    with pytest.raises(RuntimeError, match="bootstrap failed"):
        await service.start_ticker_stream()

    assert started_calls == []
    assert service.get_ticker_stream_status().running is False


@pytest.mark.anyio
async def test_start_ticker_stream_raises_when_already_running() -> None:
    service = MarketDataStreamService(
        session_factory=fake_session_factory,
        app_setting_seeder=lambda session: None,
        app_setting_reader=lambda session: build_settings(),
        market_data_repository=type(
            "Repo",
            (),
            {
                "list_active_upbit_market_subscriptions": staticmethod(
                    lambda session: [build_subscription("KRW-BTC", 1)]
                )
            },
        )(),
        ticker_event_repository=FakeTickerEventRepository(),
        latest_ticker_repository=FakeLatestTickerRepository(),
        bootstrap_fetcher=empty_bootstrap_fetcher,
        stream_factory=make_stream_factory([], []),
        ticker_normalizer=lambda payload: build_message(payload["code"]),
    )

    await service.start_ticker_stream()

    with pytest.raises(MarketDataStreamAlreadyRunningError):
        await service.start_ticker_stream()

    await service.stop_ticker_stream()
