from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.exchange import Exchange
from app.models.market_sync_run import MarketSyncRun
from app.models.market_sync_run_item import MarketSyncRunItem


class MarketSyncRunRepository:
    async def create_run_with_items(
        self,
        session: AsyncSession,
        exchanges: list[Exchange],
        *,
        requested_at: datetime,
    ) -> MarketSyncRun:
        run = MarketSyncRun(
            status="queued",
            requested_at=requested_at,
            total_exchanges=len(exchanges),
            completed_exchanges=0,
            failed_exchanges=0,
        )
        session.add(run)
        await session.flush()

        session.add_all(
            [
                MarketSyncRunItem(
                    run_id=run.id,
                    exchange_id=exchange.id,
                    status="queued",
                    inserted_count=0,
                    updated_count=0,
                    deactivated_count=0,
                )
                for exchange in exchanges
            ]
        )
        await session.flush()
        return run

    async def list_run_item_ids(
        self,
        session: AsyncSession,
        run_id: UUID,
    ) -> list[int]:
        result = await session.scalars(
            select(MarketSyncRunItem.id)
            .where(MarketSyncRunItem.run_id == run_id)
            .order_by(MarketSyncRunItem.id)
        )
        return list(result)

    async def get_run_with_items(
        self,
        session: AsyncSession,
        run_id: UUID,
    ) -> MarketSyncRun | None:
        return await session.scalar(
            select(MarketSyncRun)
            .options(
                selectinload(MarketSyncRun.items).selectinload(MarketSyncRunItem.exchange)
            )
            .where(MarketSyncRun.id == run_id)
        )

    async def get_run_item(
        self,
        session: AsyncSession,
        item_id: int,
    ) -> MarketSyncRunItem | None:
        return await session.scalar(
            select(MarketSyncRunItem)
            .options(selectinload(MarketSyncRunItem.exchange))
            .where(MarketSyncRunItem.id == item_id)
        )

    async def mark_run_started(
        self,
        session: AsyncSession,
        run: MarketSyncRun,
        *,
        started_at: datetime,
    ) -> None:
        run.status = "running"
        run.started_at = started_at
        await session.flush()

    async def mark_item_running(
        self,
        session: AsyncSession,
        item: MarketSyncRunItem,
        *,
        started_at: datetime,
    ) -> None:
        item.status = "running"
        item.started_at = started_at
        await session.flush()

    async def mark_item_completed(
        self,
        session: AsyncSession,
        item: MarketSyncRunItem,
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
        await session.flush()

    async def mark_item_failed(
        self,
        session: AsyncSession,
        item: MarketSyncRunItem,
        *,
        finished_at: datetime,
        error_message: str,
    ) -> None:
        item.status = "failed"
        item.finished_at = finished_at
        item.error_message = error_message
        await session.flush()

    async def finalize_run(
        self,
        session: AsyncSession,
        run: MarketSyncRun,
        *,
        finished_at: datetime,
    ) -> None:
        items = run.items
        run.completed_exchanges = sum(item.status == "completed" for item in items)
        run.failed_exchanges = sum(item.status == "failed" for item in items)
        run.status = "completed" if run.failed_exchanges == 0 else "failed"
        run.finished_at = finished_at
        await session.flush()


market_sync_run_repository = MarketSyncRunRepository()
