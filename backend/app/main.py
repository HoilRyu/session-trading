from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import ping_database
from app.services.market_data_stream import get_market_data_stream_service


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    await ping_database()
    stream_services = []

    for exchange_code in ("upbit", "bithumb", "binance"):
        if not getattr(settings, f"{exchange_code}_ticker_auto_start", False):
            continue

        stream_service = get_market_data_stream_service(exchange_code)
        await stream_service.start_ticker_stream()
        stream_services.append(stream_service)

    try:
        yield
    finally:
        for stream_service in reversed(stream_services):
            if stream_service.get_ticker_stream_status().running:
                await stream_service.stop_ticker_stream()


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(title=settings.app_name, lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(api_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
