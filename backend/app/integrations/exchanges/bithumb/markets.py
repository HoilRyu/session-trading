from __future__ import annotations

from app.integrations.exchanges.base.models import NormalizedMarketListing
from app.integrations.exchanges.bithumb.client import BithumbPublicClient
from app.integrations.exchanges.bithumb.normalizers import normalize_market
from app.integrations.exchanges.bithumb.schemas import BithumbMarket


class BithumbMarketCatalogFetcher:
    def __init__(self, client: BithumbPublicClient | None = None) -> None:
        self._client = client or BithumbPublicClient()

    async def fetch_markets(self) -> list[NormalizedMarketListing]:
        payload = await self._client.get_json("/v1/market/all")
        markets = [BithumbMarket.model_validate(item) for item in payload]
        return [normalize_market(market) for market in markets]
