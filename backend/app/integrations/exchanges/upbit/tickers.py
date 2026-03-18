from __future__ import annotations

from app.integrations.exchanges.upbit.client import UpbitPublicClient


def build_quote_currency_params(codes: list[str]) -> list[str]:
    return sorted({code.split("-", 1)[0] for code in codes if "-" in code})


class UpbitTickerSnapshotFetcher:
    def __init__(self, client: UpbitPublicClient | None = None) -> None:
        self._client = client or UpbitPublicClient()

    async def fetch_ticker_snapshots(self, codes: list[str]) -> list[dict]:
        if not codes:
            return []

        payload = await self._client.get_json(
            "/v1/ticker/all",
            params={"quote_currencies": ",".join(build_quote_currency_params(codes))},
        )
        allowed_codes = set(codes)
        return [
            item
            for item in payload
            if str(item.get("market", item.get("code", ""))) in allowed_codes
        ]
