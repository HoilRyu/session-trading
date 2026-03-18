from __future__ import annotations

from pydantic import BaseModel


class BithumbMarket(BaseModel):
    market: str
    korean_name: str | None = None
    english_name: str | None = None
