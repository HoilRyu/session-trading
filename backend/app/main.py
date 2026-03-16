from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import ping_database


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await ping_database()
    yield


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
