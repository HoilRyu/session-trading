from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class MarketSyncRun(TimestampMixin, Base):
    __tablename__ = "market_sync_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_exchanges: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_exchanges: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_exchanges: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    items = relationship("MarketSyncRunItem", back_populates="run")
