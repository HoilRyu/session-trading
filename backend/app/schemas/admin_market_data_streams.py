from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class TickerStreamControlResponse(BaseModel):
    stream: str
    exchange: str
    status: str
    subscribed_market_count: int


class TickerStreamStatusResponse(BaseModel):
    stream: str
    exchange: str
    status: str
    subscribed_market_count: int
    buffered_event_count: int
    last_received_at: datetime | None
    last_flushed_at: datetime | None
    last_error: str | None
