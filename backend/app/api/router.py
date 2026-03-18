from fastapi import APIRouter

from app.api.routes.admin_market_data_streams import router as admin_market_data_streams_router
from app.api.routes.admin_market_syncs import router as admin_market_syncs_router
from app.api.routes.health import router as health_router
from app.api.routes.markets import router as markets_router
from app.api.routes.settings import router as settings_router


api_router = APIRouter()
api_router.include_router(admin_market_data_streams_router)
api_router.include_router(admin_market_syncs_router)
api_router.include_router(health_router)
api_router.include_router(markets_router)
api_router.include_router(settings_router)
