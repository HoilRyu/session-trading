from __future__ import annotations

from fastapi import APIRouter, Depends

from app.db.session import SessionLocal
from app.repositories.market_queries import (
    MarketQueryRepository,
    get_market_query_repository,
)
from app.schemas.market_listings import (
    MarketListItem,
    MarketListQueryParams,
    MarketListResponse,
)


router = APIRouter(prefix="/api/v1/markets", tags=["markets"])


@router.get("", response_model=MarketListResponse)
async def list_markets(
    params: MarketListQueryParams = Depends(),
    repository: MarketQueryRepository = Depends(get_market_query_repository),
) -> MarketListResponse:
    async with SessionLocal() as session:
        result = await repository.list_markets(session, params)

    return MarketListResponse(
        start=params.start,
        limit=params.limit,
        total=result.total,
        refreshed_at=result.refreshed_at,
        items=[MarketListItem.model_validate(item) for item in result.items],
    )
