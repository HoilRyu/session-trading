import pytest

from app.bootstrap.exchanges import ensure_default_exchanges


class FakeSession:
    def __init__(self) -> None:
        self.flush_count = 0

    async def flush(self) -> None:
        self.flush_count += 1


class FakeExchangeRepository:
    def __init__(self) -> None:
        self.codes: set[str] = set()
        self.created_codes: list[str] = []

    async def get_exchange_by_code(self, session, code: str):
        if code in self.codes:
            return {"code": code}
        return None

    async def create_exchange(self, session, **payload):
        self.codes.add(payload["code"])
        self.created_codes.append(payload["code"])
        return payload


@pytest.mark.anyio
async def test_ensure_default_exchanges_is_idempotent() -> None:
    session = FakeSession()
    repository = FakeExchangeRepository()

    await ensure_default_exchanges(session, repository=repository)
    await ensure_default_exchanges(session, repository=repository)

    assert repository.created_codes == ["upbit", "bithumb", "binance"]
    assert session.flush_count == 2
