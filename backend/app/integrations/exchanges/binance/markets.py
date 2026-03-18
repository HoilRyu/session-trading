from __future__ import annotations

from app.integrations.exchanges.base.models import NormalizedMarketListing
from app.integrations.exchanges.binance.client import BinancePublicClient
from app.integrations.exchanges.binance.normalizers import normalize_market
from app.integrations.exchanges.binance.schemas import (
    BinanceExchangeInfoResponse,
    BinanceMarket,
)


class BinanceMarketCatalogFetcher:
    def __init__(self, client: BinancePublicClient | None = None) -> None:
        self._client = client or BinancePublicClient()

    async def fetch_markets(self) -> list[NormalizedMarketListing]:
        payload = await self._client.get_json("/api/v3/exchangeInfo")
        response = BinanceExchangeInfoResponse.model_validate(payload)
        markets = [
            market
            for market in response.symbols
            if _is_tradable_spot_market(market)
        ]
        return [normalize_market(market) for market in markets]


def _is_tradable_spot_market(market: BinanceMarket) -> bool:
    return (
        market.status == "TRADING"
        and market.symbol.isascii()
        and market.symbol.isalnum()
        and market.baseAsset.isascii()
        and market.baseAsset.isalnum()
        and market.quoteAsset.isascii()
        and market.quoteAsset.isalnum()
        and (
        market.isSpotTradingAllowed or "SPOT" in market.permissions
        )
    )
