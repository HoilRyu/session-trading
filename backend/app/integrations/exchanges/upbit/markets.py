from __future__ import annotations

from app.integrations.exchanges.base.models import NormalizedMarketListing
from app.integrations.exchanges.upbit.client import UpbitPublicClient
from app.integrations.exchanges.upbit.normalizers import normalize_market
from app.integrations.exchanges.upbit.schemas import UpbitMarket


class UpbitMarketCatalogFetcher:
    def __init__(self, client: UpbitPublicClient | None = None) -> None:
        self._client = client or UpbitPublicClient()

    async def fetch_markets(self) -> list[NormalizedMarketListing]:
        payload = await self._client.get_json(
            "/v1/market/all",
            params={"is_details": "true"},
        )
        markets = [UpbitMarket.model_validate(item) for item in payload]
        return [normalize_market(market) for market in markets]
