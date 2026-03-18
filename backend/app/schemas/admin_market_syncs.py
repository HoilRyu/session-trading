from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MarketSyncRunQueuedResponse(BaseModel):
    run_id: UUID
    status: str
    queued_exchange_count: int


class MarketSyncRunItemResponse(BaseModel):
    exchange_code: str
    status: str
    inserted_count: int
    updated_count: int
    deactivated_count: int
    error_message: str | None


class MarketSyncRunDetailResponse(BaseModel):
    run_id: UUID
    status: str
    requested_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    total_exchanges: int
    completed_exchanges: int
    failed_exchanges: int
    items: list[MarketSyncRunItemResponse]
