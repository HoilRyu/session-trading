from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from app.integrations.exchanges.base.models import NormalizedMarketListing
from app.repositories.market_listings import MarketUpsertResult
from app.services.market_catalog_sync import MarketCatalogSyncService


@dataclass
class FakeExchange:
    id: int
    code: str
    name: str = "Upbit"
    deactivate_after_misses: int = 2
    last_sync_status: str | None = None
    last_sync_at: datetime | None = None
    last_error: str | None = None


@dataclass
class FakeRunItem:
    id: int
    run_id: UUID
    exchange: FakeExchange
    exchange_id: int
    status: str = "queued"
    started_at: datetime | None = None
    finished_at: datetime | None = None
    inserted_count: int = 0
    updated_count: int = 0
    deactivated_count: int = 0
    error_message: str | None = None


@dataclass
class FakeRun:
    id: UUID
    status: str
    requested_at: datetime
    total_exchanges: int
    completed_exchanges: int
    failed_exchanges: int
    items: list[FakeRunItem] = field(default_factory=list)
    started_at: datetime | None = None
    finished_at: datetime | None = None


class FakeSession:
    def __init__(self) -> None:
        self.commit_count = 0
        self.rollback_count = 0

    async def commit(self) -> None:
        self.commit_count += 1

    async def rollback(self) -> None:
        self.rollback_count += 1

    async def flush(self) -> None:
        return None


class FakeSessionFactory:
    def __init__(self, session: FakeSession) -> None:
        self.session = session

    def __call__(self):
        return self

    async def __aenter__(self) -> FakeSession:
        return self.session

    async def __aexit__(self, exc_type, exc, tb) -> bool:
        return False


class FakeExchangeRepository:
    def __init__(self, exchange: FakeExchange) -> None:
        self.exchange = exchange

    async def list_sync_enabled_exchanges(self, session) -> list[FakeExchange]:
        return [self.exchange]

    async def update_exchange_sync_result(
        self,
        session,
        exchange: FakeExchange,
        *,
        status: str,
        synced_at: datetime,
        error_message: str | None = None,
    ) -> None:
        exchange.last_sync_status = status
        exchange.last_sync_at = synced_at
        exchange.last_error = error_message


class FakeRunRepository:
    def __init__(self, exchange: FakeExchange) -> None:
        self.exchange = exchange
        self.run: FakeRun | None = None
        self.item: FakeRunItem | None = None

    async def create_run_with_items(self, session, exchanges, *, requested_at: datetime):
        run_id = uuid4()
        self.item = FakeRunItem(
            id=1,
            run_id=run_id,
            exchange=self.exchange,
            exchange_id=self.exchange.id,
        )
        self.run = FakeRun(
            id=run_id,
            status="queued",
            requested_at=requested_at,
            total_exchanges=len(exchanges),
            completed_exchanges=0,
            failed_exchanges=0,
            items=[self.item],
        )
        return self.run

    async def list_run_item_ids(self, session, run_id: UUID) -> list[int]:
        return [1] if self.run and self.run.id == run_id else []

    async def get_run_with_items(self, session, run_id: UUID):
        if self.run and self.run.id == run_id:
            return self.run
        return None

    async def get_run_item(self, session, item_id: int):
        if self.item and self.item.id == item_id:
            return self.item
        return None

    async def mark_run_started(self, session, run: FakeRun, *, started_at: datetime) -> None:
        run.status = "running"
        run.started_at = started_at

    async def mark_item_running(self, session, item: FakeRunItem, *, started_at: datetime) -> None:
        item.status = "running"
        item.started_at = started_at

    async def mark_item_completed(
        self,
        session,
        item: FakeRunItem,
        *,
        finished_at: datetime,
        inserted_count: int,
        updated_count: int,
        deactivated_count: int,
    ) -> None:
        item.status = "completed"
        item.finished_at = finished_at
        item.inserted_count = inserted_count
        item.updated_count = updated_count
        item.deactivated_count = deactivated_count
        item.error_message = None

    async def mark_item_failed(
        self,
        session,
        item: FakeRunItem,
        *,
        finished_at: datetime,
        error_message: str,
    ) -> None:
        item.status = "failed"
        item.finished_at = finished_at
        item.error_message = error_message

    async def finalize_run(self, session, run: FakeRun, *, finished_at: datetime) -> None:
        run.completed_exchanges = sum(item.status == "completed" for item in run.items)
        run.failed_exchanges = sum(item.status == "failed" for item in run.items)
        run.status = "completed" if run.failed_exchanges == 0 else "failed"
        run.finished_at = finished_at


class FakeMarketListingRepository:
    def __init__(self) -> None:
        self.current_symbols = {
            "KRW-ETH": {"is_active": True, "missing_count": 1},
        }

    async def upsert_market_listings(
        self,
        session,
        *,
        exchange_id: int,
        market_type: str,
        markets: list[NormalizedMarketListing],
        observed_at: datetime,
    ) -> MarketUpsertResult:
        inserted_count = 0
        updated_count = 0
        for market in markets:
            state = self.current_symbols.get(market.raw_symbol)
            if state is None:
                self.current_symbols[market.raw_symbol] = {
                    "is_active": True,
                    "missing_count": 0,
                }
                inserted_count += 1
            else:
                state["is_active"] = True
                state["missing_count"] = 0
                updated_count += 1

        return MarketUpsertResult(
            inserted_count=inserted_count,
            updated_count=updated_count,
            seen_symbols={market.raw_symbol for market in markets},
        )

    async def mark_missing_market_listings(
        self,
        session,
        *,
        exchange: FakeExchange,
        market_type: str,
        seen_symbols: set[str],
        observed_at: datetime,
    ) -> int:
        deactivated_count = 0
        for symbol, state in self.current_symbols.items():
            if symbol in seen_symbols or state["is_active"] is False:
                continue
            state["missing_count"] += 1
            if state["missing_count"] >= exchange.deactivate_after_misses:
                state["is_active"] = False
                deactivated_count += 1

        return deactivated_count


class FakeLockManager:
    def __init__(self, *, lock_available: bool = True) -> None:
        self.lock_available = lock_available
        self.released_codes: list[str] = []

    async def try_acquire_exchange_lock(self, session, exchange_code: str) -> bool:
        return self.lock_available

    async def release_exchange_lock(self, session, exchange_code: str) -> None:
        self.released_codes.append(exchange_code)


class FakeSeeder:
    def __init__(self) -> None:
        self.call_count = 0

    async def __call__(self, session) -> None:
        self.call_count += 1


class FakeUpbitFetcher:
    def __init__(self, markets: list[NormalizedMarketListing]) -> None:
        self.markets = markets

    async def fetch_markets(self) -> list[NormalizedMarketListing]:
        return self.markets


def build_market(symbol: str) -> NormalizedMarketListing:
    quote_asset, base_asset = symbol.split("-", maxsplit=1)
    return NormalizedMarketListing(
        market_type="spot",
        raw_symbol=symbol,
        base_asset=base_asset,
        quote_asset=quote_asset,
        display_name_ko="테스트",
        display_name_en="Test",
        availability_status="listed",
        exchange_status=None,
        has_warning=False,
        warning_flags={},
        source_payload={"market": symbol},
    )


@pytest.mark.anyio
async def test_enqueue_sync_creates_run_for_enabled_sync_exchanges() -> None:
    exchange = FakeExchange(id=1, code="upbit")
    service = MarketCatalogSyncService(
        session_factory=FakeSessionFactory(FakeSession()),
        exchange_repository=FakeExchangeRepository(exchange),
        market_listing_repository=FakeMarketListingRepository(),
        run_repository=FakeRunRepository(exchange),
        exchange_seeder=FakeSeeder(),
        lock_manager=FakeLockManager(),
        upbit_market_fetcher=FakeUpbitFetcher([build_market("KRW-BTC")]),
    )

    run = await service.enqueue_market_sync()

    assert run.status == "queued"
    assert run.queued_exchange_count == 1


@pytest.mark.anyio
async def test_run_market_sync_updates_counts_and_deactivates_missing_markets() -> None:
    exchange = FakeExchange(id=1, code="upbit", deactivate_after_misses=2)
    run_repository = FakeRunRepository(exchange)
    market_listing_repository = FakeMarketListingRepository()
    lock_manager = FakeLockManager()
    service = MarketCatalogSyncService(
        session_factory=FakeSessionFactory(FakeSession()),
        exchange_repository=FakeExchangeRepository(exchange),
        market_listing_repository=market_listing_repository,
        run_repository=run_repository,
        exchange_seeder=FakeSeeder(),
        lock_manager=lock_manager,
        upbit_market_fetcher=FakeUpbitFetcher([build_market("KRW-BTC")]),
    )

    queued_run = await service.enqueue_market_sync()
    await service.run_market_sync(queued_run.run_id)

    assert run_repository.run is not None
    assert run_repository.item is not None
    assert run_repository.run.status == "completed"
    assert run_repository.item.status == "completed"
    assert run_repository.item.inserted_count == 1
    assert run_repository.item.updated_count == 0
    assert run_repository.item.deactivated_count == 1
    assert market_listing_repository.current_symbols["KRW-ETH"]["is_active"] is False
    assert lock_manager.released_codes == ["upbit"]


@pytest.mark.anyio
async def test_run_market_sync_marks_item_failed_when_lock_is_unavailable() -> None:
    exchange = FakeExchange(id=1, code="upbit")
    run_repository = FakeRunRepository(exchange)
    service = MarketCatalogSyncService(
        session_factory=FakeSessionFactory(FakeSession()),
        exchange_repository=FakeExchangeRepository(exchange),
        market_listing_repository=FakeMarketListingRepository(),
        run_repository=run_repository,
        exchange_seeder=FakeSeeder(),
        lock_manager=FakeLockManager(lock_available=False),
        upbit_market_fetcher=FakeUpbitFetcher([build_market("KRW-BTC")]),
    )

    queued_run = await service.enqueue_market_sync()
    await service.run_market_sync(queued_run.run_id)

    assert run_repository.run is not None
    assert run_repository.item is not None
    assert run_repository.run.status == "failed"
    assert run_repository.item.status == "failed"
    assert run_repository.item.error_message == "sync already running for exchange"
    assert exchange.last_error == "sync already running for exchange"
