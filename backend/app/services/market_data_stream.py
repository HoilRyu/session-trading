from __future__ import annotations

import asyncio
import inspect
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from app.db.session import SessionLocal
from app.integrations.exchanges.base.models import NormalizedTickerMessage
from app.integrations.exchanges.binance.ticker_normalizers import (
    normalize_rest_ticker_snapshot as normalize_binance_rest_ticker_snapshot,
)
from app.integrations.exchanges.binance.ticker_normalizers import (
    normalize_ticker_message as normalize_binance_ticker_message,
)
from app.integrations.exchanges.binance.tickers import BinanceTickerSnapshotFetcher
from app.integrations.exchanges.binance.websocket import connect_and_stream as connect_binance_and_stream
from app.integrations.exchanges.bithumb.ticker_normalizers import (
    normalize_rest_ticker_snapshot as normalize_bithumb_rest_ticker_snapshot,
)
from app.integrations.exchanges.bithumb.ticker_normalizers import (
    normalize_ticker_message as normalize_bithumb_ticker_message,
)
from app.integrations.exchanges.bithumb.tickers import BithumbTickerSnapshotFetcher
from app.integrations.exchanges.bithumb.websocket import connect_and_stream as connect_bithumb_and_stream
from app.integrations.exchanges.upbit.ticker_normalizers import (
    normalize_rest_ticker_snapshot as normalize_upbit_rest_ticker_snapshot,
)
from app.integrations.exchanges.upbit.ticker_normalizers import (
    normalize_ticker_message as normalize_upbit_ticker_message,
)
from app.integrations.exchanges.upbit.tickers import UpbitTickerSnapshotFetcher
from app.integrations.exchanges.upbit.websocket import connect_and_stream as connect_upbit_and_stream
from app.repositories.app_settings import (
    TickerStreamSettings,
    ensure_default_app_settings,
    get_ticker_settings,
)
from app.repositories.latest_market_tickers import (
    LatestMarketTickerRepository,
    latest_market_ticker_repository,
)
from app.repositories.market_data_streams import (
    MarketDataStreamRepository,
    MarketSubscription,
    market_data_stream_repository,
)
from app.repositories.market_ticker_events import (
    MarketTickerEventRepository,
    TickerEventWrite,
    market_ticker_event_repository,
)

SUPPORTED_TICKER_STREAM_EXCHANGES = ("upbit", "bithumb", "binance")


class MarketDataStreamAlreadyRunningError(RuntimeError):
    pass


class MarketDataStreamDisabledError(RuntimeError):
    pass


class NoActiveTickerMarketsError(RuntimeError):
    pass


class UnsupportedMarketDataExchangeError(ValueError):
    pass


@dataclass(slots=True)
class TickerStreamStatus:
    stream: str
    exchange: str
    running: bool
    subscribed_market_count: int
    buffered_event_count: int
    last_received_at: datetime | None
    last_flushed_at: datetime | None
    last_error: str | None

    @property
    def status(self) -> str:
        return "running" if self.running else "stopped"


class MarketDataStreamService:
    def __init__(
        self,
        *,
        exchange_code: str = "upbit",
        session_factory,
        app_setting_seeder=ensure_default_app_settings,
        app_setting_reader=get_ticker_settings,
        subscription_reader=None,
        market_data_repository: MarketDataStreamRepository = market_data_stream_repository,
        ticker_event_repository: MarketTickerEventRepository = market_ticker_event_repository,
        latest_ticker_repository: LatestMarketTickerRepository = latest_market_ticker_repository,
        bootstrap_fetcher=None,
        bootstrap_ticker_normalizer=None,
        stream_factory=None,
        ticker_normalizer=None,
    ) -> None:
        self._exchange_code = exchange_code
        self._session_factory = session_factory
        self._app_setting_seeder = app_setting_seeder
        self._app_setting_reader = app_setting_reader
        if subscription_reader is not None:
            self._subscription_reader = subscription_reader
        else:
            self._subscription_reader = getattr(
                market_data_repository,
                "list_active_market_subscriptions",
                None,
            ) or getattr(
                market_data_repository,
                "list_active_upbit_market_subscriptions",
            )
        self._market_data_repository = market_data_repository
        self._ticker_event_repository = ticker_event_repository
        self._latest_ticker_repository = latest_ticker_repository
        self._bootstrap_fetcher = bootstrap_fetcher
        self._bootstrap_ticker_normalizer = bootstrap_ticker_normalizer
        self._stream_factory = stream_factory
        self._ticker_normalizer = ticker_normalizer
        self._buffer: list[TickerEventWrite] = []
        self._buffer_lock = asyncio.Lock()
        self._stream_task: asyncio.Task[None] | None = None
        self._flush_task: asyncio.Task[None] | None = None
        self._settings: TickerStreamSettings | None = None
        self._subscriptions_by_symbol: dict[str, MarketSubscription] = {}
        self._stopping = False
        self._status = TickerStreamStatus(
            stream="ticker",
            exchange=exchange_code,
            running=False,
            subscribed_market_count=0,
            buffered_event_count=0,
            last_received_at=None,
            last_flushed_at=None,
            last_error=None,
        )

    async def start_ticker_stream(self) -> TickerStreamStatus:
        if self._status.running:
            raise MarketDataStreamAlreadyRunningError("ticker 스트림이 이미 실행 중입니다.")

        async with self._session_factory() as session:
            await _maybe_await(self._app_setting_seeder(session))
            settings = await _maybe_await(
                _call_with_optional_exchange_code(
                    self._app_setting_reader,
                    session,
                    self._exchange_code,
                )
            )
            subscriptions = await _maybe_await(
                _call_with_optional_exchange_code(
                    self._subscription_reader,
                    session,
                    self._exchange_code,
                )
            )
            try:
                await self._bootstrap_latest_tickers(session, subscriptions)
            except Exception as exc:
                self._status.last_error = str(exc)
                raise
            commit = getattr(session, "commit", None)
            if callable(commit):
                await _maybe_await(commit())

        if not settings.enabled:
            raise MarketDataStreamDisabledError(
                f"{self._exchange_code} ticker 스트림이 비활성화되어 있습니다."
            )
        if not subscriptions:
            raise NoActiveTickerMarketsError(
                f"활성화된 {self._exchange_code} 마켓이 없습니다."
            )

        self._settings = settings
        self._subscriptions_by_symbol = {
            subscription.raw_symbol: subscription for subscription in subscriptions
        }
        self._status.running = True
        self._status.subscribed_market_count = len(subscriptions)
        self._status.buffered_event_count = 0
        self._status.last_error = None
        self._stream_task = asyncio.create_task(self._run_ticker_stream_loop())
        self._flush_task = asyncio.create_task(
            self._run_periodic_flush(settings.flush_interval_ms)
        )
        return self.get_ticker_stream_status()

    async def _bootstrap_latest_tickers(
        self,
        session,
        subscriptions: list[MarketSubscription],
    ) -> None:
        if not subscriptions:
            return

        subscriptions_by_symbol = {
            subscription.raw_symbol: subscription for subscription in subscriptions
        }
        snapshots = await _maybe_await(
            self._fetch_bootstrap_snapshots(list(subscriptions_by_symbol))
        )
        bootstrap_rows: list[TickerEventWrite] = []
        for snapshot in snapshots:
            normalized = await _maybe_await(self._bootstrap_ticker_normalizer(snapshot))
            subscription = subscriptions_by_symbol.get(normalized.raw_symbol)
            if subscription is None:
                continue
            bootstrap_rows.append(self._build_event_row(subscription, normalized))

        await _maybe_await(
            self._latest_ticker_repository.upsert_latest_tickers(session, bootstrap_rows)
        )

    def _fetch_bootstrap_snapshots(self, codes: list[str]):
        fetch = getattr(self._bootstrap_fetcher, "fetch_ticker_snapshots", None)
        if callable(fetch):
            return fetch(codes)
        if callable(self._bootstrap_fetcher):
            return self._bootstrap_fetcher(codes)
        raise TypeError(
            "bootstrap fetcher는 호출 가능 객체이거나 fetch_ticker_snapshots 메서드를 가져야 합니다."
        )

    async def stop_ticker_stream(self) -> TickerStreamStatus:
        self._stopping = True
        try:
            if self._stream_task is not None:
                self._stream_task.cancel()
                await _await_cancelled(self._stream_task)
                self._stream_task = None

            if self._flush_task is not None:
                self._flush_task.cancel()
                await _await_cancelled(self._flush_task)
                self._flush_task = None

            await self._flush_buffer()
        finally:
            self._buffer.clear()
            self._subscriptions_by_symbol.clear()
            self._settings = None
            self._status.running = False
            self._status.subscribed_market_count = 0
            self._status.buffered_event_count = 0
            self._stopping = False

        return self.get_ticker_stream_status()

    def get_ticker_stream_status(self) -> TickerStreamStatus:
        return TickerStreamStatus(
            stream=self._status.stream,
            exchange=self._status.exchange,
            running=self._status.running,
            subscribed_market_count=self._status.subscribed_market_count,
            buffered_event_count=self._status.buffered_event_count,
            last_received_at=self._status.last_received_at,
            last_flushed_at=self._status.last_flushed_at,
            last_error=self._status.last_error,
        )

    async def _run_ticker_stream_loop(self) -> None:
        if self._settings is None:
            return

        codes = list(self._subscriptions_by_symbol)
        try:
            async for payload in self._stream_factory(
                codes,
                use_simple_format=self._settings.use_simple_format,
            ):
                normalized = await _maybe_await(self._ticker_normalizer(payload))
                subscription = self._subscriptions_by_symbol.get(normalized.raw_symbol)
                if subscription is None:
                    continue

                event = self._build_event_row(subscription, normalized)
                async with self._buffer_lock:
                    self._buffer.append(event)
                    self._status.buffered_event_count = len(self._buffer)
                    self._status.last_received_at = normalized.received_at
                    should_flush = len(self._buffer) >= self._settings.batch_size

                if should_flush:
                    await self._flush_buffer()
                    continue

                await asyncio.sleep(0)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            self._status.last_error = str(exc)
            self._status.running = False
        finally:
            if not self._stopping:
                self._status.running = False

    async def _run_periodic_flush(self, flush_interval_ms: int) -> None:
        try:
            while self._status.running:
                await asyncio.sleep(flush_interval_ms / 1000)
                await self._flush_buffer()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            self._status.last_error = str(exc)
            self._status.running = False

    async def _flush_buffer(self) -> None:
        async with self._buffer_lock:
            if not self._buffer:
                return
            rows = list(self._buffer)
            self._buffer.clear()
            self._status.buffered_event_count = 0

        async with self._session_factory() as session:
            await _maybe_await(
                self._ticker_event_repository.insert_ticker_events(session, rows)
            )
            await _maybe_await(
                self._latest_ticker_repository.upsert_latest_tickers(session, rows)
            )
            commit = getattr(session, "commit", None)
            if callable(commit):
                await _maybe_await(commit())

        self._status.last_flushed_at = datetime.now(UTC)

    def _build_event_row(
        self,
        subscription: MarketSubscription,
        normalized: NormalizedTickerMessage,
    ) -> TickerEventWrite:
        return TickerEventWrite(
            event_time=normalized.event_time,
            received_at=normalized.received_at,
            exchange_id=subscription.exchange_id,
            market_listing_id=subscription.market_listing_id,
            raw_symbol=normalized.raw_symbol,
            trade_price=Decimal(str(normalized.trade_price)),
            signed_change_rate=(
                Decimal(str(normalized.signed_change_rate))
                if normalized.signed_change_rate is not None
                else None
            ),
            acc_trade_volume_24h=(
                Decimal(str(normalized.acc_trade_volume_24h))
                if normalized.acc_trade_volume_24h is not None
                else None
            ),
            source_payload=normalized.source_payload,
            acc_trade_price_24h=(
                Decimal(str(normalized.acc_trade_price_24h))
                if normalized.acc_trade_price_24h is not None
                else None
            ),
        )


def build_market_data_stream_service(exchange_code: str) -> MarketDataStreamService:
    if exchange_code == "upbit":
        return MarketDataStreamService(
            exchange_code=exchange_code,
            session_factory=SessionLocal,
            bootstrap_fetcher=UpbitTickerSnapshotFetcher(),
            bootstrap_ticker_normalizer=normalize_upbit_rest_ticker_snapshot,
            stream_factory=connect_upbit_and_stream,
            ticker_normalizer=normalize_upbit_ticker_message,
        )

    if exchange_code == "bithumb":
        return MarketDataStreamService(
            exchange_code=exchange_code,
            session_factory=SessionLocal,
            bootstrap_fetcher=BithumbTickerSnapshotFetcher(),
            bootstrap_ticker_normalizer=normalize_bithumb_rest_ticker_snapshot,
            stream_factory=connect_bithumb_and_stream,
            ticker_normalizer=normalize_bithumb_ticker_message,
        )

    if exchange_code == "binance":
        return MarketDataStreamService(
            exchange_code=exchange_code,
            session_factory=SessionLocal,
            subscription_reader=market_data_stream_repository.list_active_binance_market_subscriptions,
            bootstrap_fetcher=BinanceTickerSnapshotFetcher(),
            bootstrap_ticker_normalizer=normalize_binance_rest_ticker_snapshot,
            stream_factory=connect_binance_and_stream,
            ticker_normalizer=normalize_binance_ticker_message,
        )

    raise UnsupportedMarketDataExchangeError(f"지원하지 않는 거래소입니다: {exchange_code}")


async def _maybe_await(result: Any) -> Any:
    if inspect.isawaitable(result):
        return await result
    return result


async def _await_cancelled(task: asyncio.Task[Any]) -> None:
    try:
        await task
    except asyncio.CancelledError:
        return


def _call_with_optional_exchange_code(callback, session, exchange_code: str):
    signature = inspect.signature(callback)
    parameters = list(signature.parameters)
    if "exchange_code" in parameters:
        return callback(session, exchange_code=exchange_code)
    if len(parameters) >= 2:
        return callback(session, exchange_code)
    return callback(session)


market_data_stream_services: dict[str, MarketDataStreamService] = {}


def get_market_data_stream_service(
    exchange_code: str = "upbit",
) -> MarketDataStreamService:
    if exchange_code not in market_data_stream_services:
        market_data_stream_services[exchange_code] = build_market_data_stream_service(
            exchange_code
        )
    return market_data_stream_services[exchange_code]
