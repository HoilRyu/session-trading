from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class UpbitMarketEvent(BaseModel):
    warning: bool | str | None = None
    caution: dict[str, Any] = Field(default_factory=dict)


class UpbitMarket(BaseModel):
    market: str
    korean_name: str | None = None
    english_name: str | None = None
    market_event: UpbitMarketEvent = Field(default_factory=UpbitMarketEvent)
