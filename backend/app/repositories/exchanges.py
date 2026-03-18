from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exchange import Exchange


class ExchangeRepository:
    async def list_sync_enabled_exchanges(self, session: AsyncSession) -> list[Exchange]:
        result = await session.scalars(
            select(Exchange)
            .where(Exchange.enabled.is_(True), Exchange.sync_enabled.is_(True))
            .order_by(Exchange.id)
        )
        return list(result)

    async def get_exchange_by_code(
        self,
        session: AsyncSession,
        code: str,
    ) -> Exchange | None:
        return await session.scalar(select(Exchange).where(Exchange.code == code))

    async def create_exchange(self, session: AsyncSession, **payload) -> Exchange:
        exchange = Exchange(**payload)
        session.add(exchange)
        await session.flush()
        return exchange

    async def update_exchange_sync_result(
        self,
        session: AsyncSession,
        exchange: Exchange,
        *,
        status: str,
        synced_at: datetime,
        error_message: str | None = None,
    ) -> None:
        exchange.last_sync_at = synced_at
        exchange.last_sync_status = status
        exchange.last_error = error_message
        await session.flush()


exchange_repository = ExchangeRepository()
