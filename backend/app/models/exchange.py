from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Exchange(TimestampMixin, Base):
    __tablename__ = "exchanges"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )
    sync_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )
    sync_interval_sec: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("300"),
    )
    deactivate_after_misses: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("3"),
    )
    last_sync_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_sync_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    market_listings = relationship("MarketListing", back_populates="exchange")
    market_sync_run_items = relationship("MarketSyncRunItem", back_populates="exchange")
