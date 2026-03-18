from __future__ import annotations

from pydantic import BaseModel, Field


class BinanceMarket(BaseModel):
    symbol: str
    status: str
    baseAsset: str
    quoteAsset: str
    isSpotTradingAllowed: bool = False
    permissions: list[str] = Field(default_factory=list)


class BinanceExchangeInfoResponse(BaseModel):
    symbols: list[BinanceMarket] = Field(default_factory=list)
