from __future__ import annotations

from app.integrations.exchanges.bithumb.client import BithumbPublicClient

TICKER_SNAPSHOT_BATCH_SIZE = 50


class BithumbTickerSnapshotFetcher:
    def __init__(self, client: BithumbPublicClient | None = None) -> None:
        self._client = client or BithumbPublicClient()

    async def fetch_ticker_snapshots(self, codes: list[str]) -> list[dict]:
        if not codes:
            return []

        allowed_codes = set(codes)
        snapshots: list[dict] = []

        for index in range(0, len(codes), TICKER_SNAPSHOT_BATCH_SIZE):
            batch = codes[index : index + TICKER_SNAPSHOT_BATCH_SIZE]
            payload = await self._client.get_json(
                "/v1/ticker",
                params={"markets": ",".join(batch)},
            )
            snapshots.extend(
                item
                for item in payload
                if str(item.get("market", "")).upper() in allowed_codes
            )

        return snapshots
