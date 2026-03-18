from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.exchanges import ExchangeRepository, exchange_repository

DEFAULT_EXCHANGES = [
    {
        "code": "upbit",
        "name": "Upbit",
        "enabled": True,
        "sync_enabled": True,
        "sync_interval_sec": 300,
        "deactivate_after_misses": 3,
    },
    {
        "code": "bithumb",
        "name": "Bithumb",
        "enabled": True,
        "sync_enabled": True,
        "sync_interval_sec": 300,
        "deactivate_after_misses": 3,
    },
    {
        "code": "binance",
        "name": "Binance",
        "enabled": True,
        "sync_enabled": True,
        "sync_interval_sec": 300,
        "deactivate_after_misses": 3,
    },
]


async def ensure_default_exchanges(
    session: AsyncSession,
    repository: ExchangeRepository = exchange_repository,
) -> None:
    for payload in DEFAULT_EXCHANGES:
        existing = await repository.get_exchange_by_code(session, payload["code"])
        if existing is None:
            await repository.create_exchange(session, **payload)

    await session.flush()
