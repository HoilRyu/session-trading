from __future__ import annotations

import zlib

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _build_lock_key(exchange_code: str) -> int:
    return zlib.crc32(f"market-sync:{exchange_code}".encode())


class ExchangeLockManager:
    async def try_acquire_exchange_lock(
        self,
        session: AsyncSession,
        exchange_code: str,
    ) -> bool:
        result = await session.execute(
            text("SELECT pg_try_advisory_lock(:lock_key)"),
            {"lock_key": _build_lock_key(exchange_code)},
        )
        return bool(result.scalar())

    async def release_exchange_lock(
        self,
        session: AsyncSession,
        exchange_code: str,
    ) -> None:
        await session.execute(
            text("SELECT pg_advisory_unlock(:lock_key)"),
            {"lock_key": _build_lock_key(exchange_code)},
        )


exchange_lock_manager = ExchangeLockManager()
