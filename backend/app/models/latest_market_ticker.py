from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class LatestMarketTicker(Base):
    __tablename__ = "latest_market_tickers"

    market_listing_id: Mapped[int] = mapped_column(
        ForeignKey("market_listings.id"),
        primary_key=True,
    )
    exchange_id: Mapped[int] = mapped_column(ForeignKey("exchanges.id"), nullable=False)
    raw_symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    trade_price: Mapped[Decimal] = mapped_column(Numeric(24, 8), nullable=False)
    signed_change_rate: Mapped[Decimal | None] = mapped_column(Numeric(20, 10), nullable=True)
    acc_trade_volume_24h: Mapped[Decimal | None] = mapped_column(Numeric(30, 10), nullable=True)
    event_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
