from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.db.session import ping_database


router = APIRouter(tags=["health"])


@router.get("/health", response_model=None)
async def read_health() -> dict[str, str] | JSONResponse:
    settings = get_settings()
    service_status = {
        "service": settings.app_name,
        "environment": settings.environment,
    }

    try:
        await ping_database()
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "unavailable",
                **service_status,
            },
        )

    return {
        "status": "ok",
        "database": "ok",
        **service_status,
    }
