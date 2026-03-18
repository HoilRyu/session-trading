from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class MarketListing(TimestampMixin, Base):
    __tablename__ = "market_listings"
    __table_args__ = (
        UniqueConstraint("exchange_id", "market_type", "raw_symbol"),
        Index("ix_market_listings_exchange_id_is_active", "exchange_id", "is_active"),
        Index("ix_market_listings_exchange_id_base_asset", "exchange_id", "base_asset"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    exchange_id: Mapped[int] = mapped_column(ForeignKey("exchanges.id"), nullable=False)
    market_type: Mapped[str] = mapped_column(String(32), nullable=False)
    raw_symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    base_asset: Mapped[str] = mapped_column(String(32), nullable=False)
    quote_asset: Mapped[str] = mapped_column(String(32), nullable=False)
    display_name_ko: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    availability_status: Mapped[str] = mapped_column(String(32), nullable=False)
    exchange_status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    has_warning: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    warning_flags: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )
    missing_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    inactive_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    exchange = relationship("Exchange", back_populates="market_listings")
