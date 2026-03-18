from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.schemas.admin_market_syncs import (
    MarketSyncRunDetailResponse,
    MarketSyncRunItemResponse,
    MarketSyncRunQueuedResponse,
)
from app.services.market_catalog_sync import (
    MarketCatalogSyncService,
    NoSyncEnabledExchangesError,
    get_market_catalog_sync_service,
)

router = APIRouter(prefix="/admin/market-syncs", tags=["admin-market-syncs"])


@router.post(
    "",
    response_model=MarketSyncRunQueuedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_market_sync(
    background_tasks: BackgroundTasks,
    service: MarketCatalogSyncService = Depends(get_market_catalog_sync_service),
) -> MarketSyncRunQueuedResponse:
    try:
        queued_run = await service.enqueue_market_sync()
    except NoSyncEnabledExchangesError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    background_tasks.add_task(service.run_market_sync, queued_run.run_id)
    return MarketSyncRunQueuedResponse(
        run_id=queued_run.run_id,
        status=queued_run.status,
        queued_exchange_count=queued_run.queued_exchange_count,
    )


@router.get("/{run_id}", response_model=MarketSyncRunDetailResponse)
async def get_market_sync_run(
    run_id: UUID,
    service: MarketCatalogSyncService = Depends(get_market_catalog_sync_service),
) -> MarketSyncRunDetailResponse:
    run = await service.get_run_detail(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="동기화 작업을 찾을 수 없습니다.")

    return MarketSyncRunDetailResponse(
        run_id=run.id,
        status=run.status,
        requested_at=run.requested_at,
        started_at=run.started_at,
        finished_at=run.finished_at,
        total_exchanges=run.total_exchanges,
        completed_exchanges=run.completed_exchanges,
        failed_exchanges=run.failed_exchanges,
        items=[
            MarketSyncRunItemResponse(
                exchange_code=item.exchange.code,
                status=item.status,
                inserted_count=item.inserted_count,
                updated_count=item.updated_count,
                deactivated_count=item.deactivated_count,
                error_message=item.error_message,
            )
            for item in run.items
        ],
    )
