from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from app.bootstrap.exchanges import ensure_default_exchanges
from app.db.locks import ExchangeLockManager, exchange_lock_manager
from app.db.session import SessionLocal
from app.integrations.exchanges.binance.markets import BinanceMarketCatalogFetcher
from app.integrations.exchanges.bithumb.markets import BithumbMarketCatalogFetcher
from app.integrations.exchanges.upbit.markets import UpbitMarketCatalogFetcher
from app.repositories.exchanges import ExchangeRepository, exchange_repository
from app.repositories.market_listings import MarketListingRepository, market_listing_repository
from app.repositories.market_sync_runs import MarketSyncRunRepository, market_sync_run_repository


class NoSyncEnabledExchangesError(RuntimeError):
    pass


@dataclass(slots=True)
class QueuedMarketSyncRun:
    run_id: UUID
    status: str
    queued_exchange_count: int


class MarketCatalogSyncService:
    def __init__(
        self,
        *,
        session_factory=SessionLocal,
        exchange_repository: ExchangeRepository = exchange_repository,
        market_listing_repository: MarketListingRepository = market_listing_repository,
        run_repository: MarketSyncRunRepository = market_sync_run_repository,
        exchange_seeder=ensure_default_exchanges,
        lock_manager: ExchangeLockManager = exchange_lock_manager,
        upbit_market_fetcher: UpbitMarketCatalogFetcher | None = None,
        binance_market_fetcher: BinanceMarketCatalogFetcher | None = None,
        market_fetchers: dict[str, object] | None = None,
    ) -> None:
        self._session_factory = session_factory
        self._exchange_repository = exchange_repository
        self._market_listing_repository = market_listing_repository
        self._run_repository = run_repository
        self._exchange_seeder = exchange_seeder
        self._lock_manager = lock_manager
        self._market_fetchers = market_fetchers or {
            "upbit": upbit_market_fetcher or UpbitMarketCatalogFetcher(),
            "bithumb": BithumbMarketCatalogFetcher(),
            "binance": binance_market_fetcher or BinanceMarketCatalogFetcher(),
        }

    async def enqueue_market_sync(self) -> QueuedMarketSyncRun:
        async with self._session_factory() as session:
            await self._exchange_seeder(session)
            exchanges = await self._exchange_repository.list_sync_enabled_exchanges(session)
            if not exchanges:
                raise NoSyncEnabledExchangesError("동기화 가능한 거래소가 없습니다.")

            requested_at = datetime.now(UTC)
            run = await self._run_repository.create_run_with_items(
                session,
                exchanges,
                requested_at=requested_at,
            )
            await session.commit()
            return QueuedMarketSyncRun(
                run_id=run.id,
                status=run.status,
                queued_exchange_count=len(exchanges),
            )

    async def run_market_sync(self, run_id: UUID) -> None:
        async with self._session_factory() as session:
            run = await self._run_repository.get_run_with_items(session, run_id)
            if run is None:
                return
            await self._run_repository.mark_run_started(
                session,
                run,
                started_at=datetime.now(UTC),
            )
            await session.commit()

        async with self._session_factory() as session:
            item_ids = await self._run_repository.list_run_item_ids(session, run_id)

        for item_id in item_ids:
            await self._run_item(item_id)

        async with self._session_factory() as session:
            run = await self._run_repository.get_run_with_items(session, run_id)
            if run is None:
                return
            await self._run_repository.finalize_run(
                session,
                run,
                finished_at=datetime.now(UTC),
            )
            await session.commit()

    async def get_run_detail(self, run_id: UUID):
        async with self._session_factory() as session:
            return await self._run_repository.get_run_with_items(session, run_id)

    async def _run_item(self, item_id: int) -> None:
        async with self._session_factory() as session:
            item = await self._run_repository.get_run_item(session, item_id)
            if item is None:
                return

            exchange = item.exchange
            lock_acquired = False
            try:
                lock_acquired = await self._lock_manager.try_acquire_exchange_lock(
                    session,
                    exchange.code,
                )
                if not lock_acquired:
                    failed_at = datetime.now(UTC)
                    await self._run_repository.mark_item_failed(
                        session,
                        item,
                        finished_at=failed_at,
                        error_message="sync already running for exchange",
                    )
                    await self._exchange_repository.update_exchange_sync_result(
                        session,
                        exchange,
                        status="failed",
                        synced_at=failed_at,
                        error_message="sync already running for exchange",
                    )
                    await session.commit()
                    return

                await self._run_repository.mark_item_running(
                    session,
                    item,
                    started_at=datetime.now(UTC),
                )
                markets = await self._fetch_markets(exchange.code)
                observed_at = datetime.now(UTC)
                upsert_result = await self._market_listing_repository.upsert_market_listings(
                    session,
                    exchange_id=exchange.id,
                    market_type="spot",
                    markets=markets,
                    observed_at=observed_at,
                )
                deactivated_count = (
                    await self._market_listing_repository.mark_missing_market_listings(
                        session,
                        exchange=exchange,
                        market_type="spot",
                        seen_symbols=upsert_result.seen_symbols,
                        observed_at=observed_at,
                    )
                )
                await self._run_repository.mark_item_completed(
                    session,
                    item,
                    finished_at=observed_at,
                    inserted_count=upsert_result.inserted_count,
                    updated_count=upsert_result.updated_count,
                    deactivated_count=deactivated_count,
                )
                await self._exchange_repository.update_exchange_sync_result(
                    session,
                    exchange,
                    status="completed",
                    synced_at=observed_at,
                )
                await session.commit()
            except Exception as exc:
                await session.rollback()
                item = await self._run_repository.get_run_item(session, item_id)
                if item is None:
                    return
                failed_at = datetime.now(UTC)
                await self._run_repository.mark_item_failed(
                    session,
                    item,
                    finished_at=failed_at,
                    error_message=str(exc),
                )
                await self._exchange_repository.update_exchange_sync_result(
                    session,
                    item.exchange,
                    status="failed",
                    synced_at=failed_at,
                    error_message=str(exc),
                )
                await session.commit()
            finally:
                if lock_acquired:
                    await self._lock_manager.release_exchange_lock(session, exchange.code)

    async def _fetch_markets(self, exchange_code: str):
        fetcher = self._market_fetchers.get(exchange_code)
        if fetcher is not None:
            return await fetcher.fetch_markets()
        raise RuntimeError(f"지원하지 않는 거래소입니다: {exchange_code}")


def get_market_catalog_sync_service() -> MarketCatalogSyncService:
    return MarketCatalogSyncService()
