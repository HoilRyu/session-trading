from __future__ import annotations

from copy import deepcopy

from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.repositories.app_settings import (
    RESETTABLE_SETTINGS_SECTIONS,
    SUPPORTED_SETTINGS_EXCHANGES,
    get_settings_document,
    get_startup_ops_settings,
    reset_settings_section,
    update_settings_document,
)
from app.schemas.settings import (
    SettingsDocument,
    SettingsPatchRequest,
    SettingsResetRequest,
    SettingsRuntimeExchangeStatus,
    SettingsRuntimeResponse,
    format_settings_validation_error,
    validate_settings_document,
)
from app.services.market_data_stream import get_market_data_stream_service

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


@router.get("", response_model=SettingsDocument)
async def get_settings_document_route() -> SettingsDocument:
    env_settings = get_settings()
    async with SessionLocal() as session:
        document = await get_settings_document(session, env_settings=env_settings)
        commit = getattr(session, "commit", None)
        if callable(commit):
            await commit()
    return validate_settings_document(document)


@router.patch("", response_model=SettingsDocument)
async def patch_settings_document_route(
    payload: SettingsPatchRequest,
) -> SettingsDocument:
    env_settings = get_settings()
    patch = payload.model_dump(exclude_none=True)

    async with SessionLocal() as session:
        current_document = await get_settings_document(session, env_settings=env_settings)
        merged_document = _merge_settings_document(current_document, patch)
        try:
            validate_settings_document(merged_document)
        except ValidationError as exc:
            raise HTTPException(
                status_code=400,
                detail=format_settings_validation_error(exc),
            ) from exc

        document = await update_settings_document(
            session,
            patch,
            env_settings=env_settings,
        )
        await session.commit()

    return validate_settings_document(document)


@router.post("/reset", response_model=SettingsDocument)
async def reset_settings_document_route(
    payload: SettingsResetRequest,
) -> SettingsDocument:
    if payload.section not in RESETTABLE_SETTINGS_SECTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"기본값 복원을 지원하지 않는 섹션입니다: {payload.section}",
        )

    env_settings = get_settings()
    async with SessionLocal() as session:
        document = await reset_settings_section(
            session,
            payload.section,
            env_settings=env_settings,
        )
        await session.commit()

    return validate_settings_document(document)


@router.get("/runtime", response_model=SettingsRuntimeResponse)
async def get_settings_runtime_route(
    request: Request,
) -> SettingsRuntimeResponse:
    env_settings = get_settings()
    exchanges: dict[str, SettingsRuntimeExchangeStatus] = {}

    for exchange_code in SUPPORTED_SETTINGS_EXCHANGES:
        try:
            stream_status = get_market_data_stream_service(exchange_code).get_ticker_stream_status()
            exchanges[exchange_code] = SettingsRuntimeExchangeStatus(
                status=stream_status.status,
                subscribed_market_count=stream_status.subscribed_market_count,
                buffered_event_count=stream_status.buffered_event_count,
                last_received_at=stream_status.last_received_at,
                last_flushed_at=stream_status.last_flushed_at,
                last_error=stream_status.last_error,
            )
        except Exception as exc:
            exchanges[exchange_code] = SettingsRuntimeExchangeStatus(
                status="unavailable",
                subscribed_market_count=0,
                buffered_event_count=0,
                last_received_at=None,
                last_flushed_at=None,
                last_error=str(exc),
            )

    return SettingsRuntimeResponse(
        environment=env_settings.environment,
        backend_status="online",
        target=str(request.base_url).rstrip("/"),
        exchanges=exchanges,
    )


def _merge_settings_document(current: dict, patch: dict) -> dict:
    merged = deepcopy(current)

    for key, value in patch.items():
        current_value = merged.get(key)
        if isinstance(current_value, dict) and isinstance(value, dict):
            merged[key] = _merge_settings_document(current_value, value)
            continue
        merged[key] = value

    return merged
