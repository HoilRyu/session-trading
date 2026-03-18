from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.admin_market_data_streams import (
    TickerStreamControlResponse,
    TickerStreamStatusResponse,
)
from app.services.market_data_stream import (
    MarketDataStreamAlreadyRunningError,
    MarketDataStreamDisabledError,
    MarketDataStreamService,
    NoActiveTickerMarketsError,
    UnsupportedMarketDataExchangeError,
    get_market_data_stream_service,
)

router = APIRouter(
    prefix="/admin/market-data-streams/ticker",
    tags=["admin-market-data-streams"],
)


def get_ticker_stream_service(
    exchange: str = Query(default="upbit"),
) -> MarketDataStreamService:
    try:
        return get_market_data_stream_service(exchange)
    except UnsupportedMarketDataExchangeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/start", response_model=TickerStreamControlResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_ticker_stream(
    service: MarketDataStreamService = Depends(get_ticker_stream_service),
) -> TickerStreamControlResponse:
    try:
        stream_status = await service.start_ticker_stream()
    except MarketDataStreamAlreadyRunningError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except (MarketDataStreamDisabledError, NoActiveTickerMarketsError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return TickerStreamControlResponse(
        stream=stream_status.stream,
        exchange=stream_status.exchange,
        status="starting",
        subscribed_market_count=stream_status.subscribed_market_count,
    )


@router.post("/stop", response_model=TickerStreamControlResponse)
async def stop_ticker_stream(
    service: MarketDataStreamService = Depends(get_ticker_stream_service),
) -> TickerStreamControlResponse:
    stream_status = await service.stop_ticker_stream()
    return TickerStreamControlResponse(
        stream=stream_status.stream,
        exchange=stream_status.exchange,
        status="stopped",
        subscribed_market_count=stream_status.subscribed_market_count,
    )


@router.get("/status", response_model=TickerStreamStatusResponse)
async def get_ticker_stream_status(
    service: MarketDataStreamService = Depends(get_ticker_stream_service),
) -> TickerStreamStatusResponse:
    stream_status = service.get_ticker_stream_status()
    return TickerStreamStatusResponse(
        stream=stream_status.stream,
        exchange=stream_status.exchange,
        status=stream_status.status,
        subscribed_market_count=stream_status.subscribed_market_count,
        buffered_event_count=stream_status.buffered_event_count,
        last_received_at=stream_status.last_received_at,
        last_flushed_at=stream_status.last_flushed_at,
        last_error=stream_status.last_error,
    )
