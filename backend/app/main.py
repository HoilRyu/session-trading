import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import SessionLocal, ping_database
from app.repositories.app_settings import get_startup_ops_settings
from app.services.market_catalog_sync import (
    NoSyncEnabledExchangesError,
    get_market_catalog_sync_service,
)
from app.services.market_data_stream import get_market_data_stream_service


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    await ping_database()
    stream_services = []
    background_tasks: list[asyncio.Task[None]] = []

    async with SessionLocal() as session:
        startup_ops = await get_startup_ops_settings(
            session,
            env_settings=settings,
        )
        commit = getattr(session, "commit", None)
        if callable(commit):
            await commit()

    if startup_ops["market_sync_on_boot"]:
        market_sync_service = get_market_catalog_sync_service()
        try:
            queued_run = await market_sync_service.enqueue_market_sync()
        except NoSyncEnabledExchangesError:
            queued_run = None
        if queued_run is not None:
            background_tasks.append(
                asyncio.create_task(market_sync_service.run_market_sync(queued_run.run_id))
            )

    for exchange_code, options in startup_ops["exchanges"].items():
        if not options["auto_start"] or not options["ticker_enabled"]:
            continue

        stream_service = get_market_data_stream_service(exchange_code)
        await stream_service.start_ticker_stream()
        stream_services.append(stream_service)

    try:
        yield
    finally:
        for task in reversed(background_tasks):
            if task.done():
                await task
                continue
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

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
