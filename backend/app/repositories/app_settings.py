from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_setting import AppSetting

DEFAULT_TICKER_STREAM_SETTINGS = {
    "upbit.ticker.enabled": True,
    "upbit.ticker.retention_days": 3,
    "upbit.ticker.flush_interval_ms": 1000,
    "upbit.ticker.batch_size": 100,
    "upbit.ticker.use_simple_format": True,
    "bithumb.ticker.enabled": True,
    "bithumb.ticker.retention_days": 3,
    "bithumb.ticker.flush_interval_ms": 1000,
    "bithumb.ticker.batch_size": 100,
    "bithumb.ticker.use_simple_format": False,
    "binance.ticker.enabled": True,
    "binance.ticker.retention_days": 3,
    "binance.ticker.flush_interval_ms": 1000,
    "binance.ticker.batch_size": 100,
    "binance.ticker.use_simple_format": False,
}

DEFAULT_TICKER_STREAM_SETTING_DESCRIPTIONS = {
    "upbit.ticker.enabled": "업비트 ticker 스트림 사용 여부",
    "upbit.ticker.retention_days": "업비트 ticker 이벤트 보관 일수",
    "upbit.ticker.flush_interval_ms": "업비트 ticker 버퍼 flush 주기(ms)",
    "upbit.ticker.batch_size": "업비트 ticker 배치 저장 건수",
    "upbit.ticker.use_simple_format": "업비트 websocket SIMPLE 포맷 사용 여부",
    "bithumb.ticker.enabled": "빗썸 ticker 스트림 사용 여부",
    "bithumb.ticker.retention_days": "빗썸 ticker 이벤트 보관 일수",
    "bithumb.ticker.flush_interval_ms": "빗썸 ticker 버퍼 flush 주기(ms)",
    "bithumb.ticker.batch_size": "빗썸 ticker 배치 저장 건수",
    "bithumb.ticker.use_simple_format": "빗썸 ticker 포맷 옵션 사용 여부",
    "binance.ticker.enabled": "바이낸스 ticker 스트림 사용 여부",
    "binance.ticker.retention_days": "바이낸스 ticker 이벤트 보관 일수",
    "binance.ticker.flush_interval_ms": "바이낸스 ticker 버퍼 flush 주기(ms)",
    "binance.ticker.batch_size": "바이낸스 ticker 배치 저장 건수",
    "binance.ticker.use_simple_format": "바이낸스 ticker 포맷 옵션 사용 여부",
}


@dataclass(slots=True)
class TickerStreamSettings:
    enabled: bool
    retention_days: int
    flush_interval_ms: int
    batch_size: int
    use_simple_format: bool


UpbitTickerSettings = TickerStreamSettings
BithumbTickerSettings = TickerStreamSettings
BinanceTickerSettings = TickerStreamSettings


class AppSettingRepository:
    async def get_setting_by_key(
        self,
        session: AsyncSession,
        key: str,
    ) -> AppSetting | None:
        return await session.get(AppSetting, key)

    async def create_setting(
        self,
        session: AsyncSession,
        *,
        key: str,
        value: Any,
        description: str | None = None,
    ) -> AppSetting:
        setting = AppSetting(key=key, value=value, description=description)
        session.add(setting)
        await session.flush()
        return setting


async def ensure_default_app_settings(
    session: AsyncSession,
    repository: AppSettingRepository | None = None,
) -> None:
    repository = repository or app_setting_repository
    for key, value in DEFAULT_TICKER_STREAM_SETTINGS.items():
        existing = await repository.get_setting_by_key(session, key)
        if existing is None:
            await repository.create_setting(
                session,
                key=key,
                value=value,
                description=DEFAULT_TICKER_STREAM_SETTING_DESCRIPTIONS.get(key),
            )

    await session.flush()


async def get_json_setting(
    session: AsyncSession,
    key: str,
    *,
    default: Any = None,
    repository: AppSettingRepository | None = None,
) -> Any:
    repository = repository or app_setting_repository
    setting = await repository.get_setting_by_key(session, key)
    if setting is None:
        return default
    return setting.value


async def get_upbit_ticker_settings(
    session: AsyncSession,
    *,
    repository: AppSettingRepository | None = None,
) -> UpbitTickerSettings:
    return await get_ticker_settings(
        session,
        exchange_code="upbit",
        repository=repository,
    )


async def get_bithumb_ticker_settings(
    session: AsyncSession,
    *,
    repository: AppSettingRepository | None = None,
) -> BithumbTickerSettings:
    return await get_ticker_settings(
        session,
        exchange_code="bithumb",
        repository=repository,
    )


async def get_binance_ticker_settings(
    session: AsyncSession,
    *,
    repository: AppSettingRepository | None = None,
) -> BinanceTickerSettings:
    return await get_ticker_settings(
        session,
        exchange_code="binance",
        repository=repository,
    )


async def get_ticker_settings(
    session: AsyncSession,
    *,
    exchange_code: str,
    repository: AppSettingRepository | None = None,
) -> TickerStreamSettings:
    repository = repository or app_setting_repository
    prefix = f"{exchange_code}.ticker"
    return TickerStreamSettings(
        enabled=bool(
            await get_json_setting(
                session,
                f"{prefix}.enabled",
                default=DEFAULT_TICKER_STREAM_SETTINGS[f"{prefix}.enabled"],
                repository=repository,
            )
        ),
        retention_days=int(
            await get_json_setting(
                session,
                f"{prefix}.retention_days",
                default=DEFAULT_TICKER_STREAM_SETTINGS[f"{prefix}.retention_days"],
                repository=repository,
            )
        ),
        flush_interval_ms=int(
            await get_json_setting(
                session,
                f"{prefix}.flush_interval_ms",
                default=DEFAULT_TICKER_STREAM_SETTINGS[f"{prefix}.flush_interval_ms"],
                repository=repository,
            )
        ),
        batch_size=int(
            await get_json_setting(
                session,
                f"{prefix}.batch_size",
                default=DEFAULT_TICKER_STREAM_SETTINGS[f"{prefix}.batch_size"],
                repository=repository,
            )
        ),
        use_simple_format=bool(
            await get_json_setting(
                session,
                f"{prefix}.use_simple_format",
                default=DEFAULT_TICKER_STREAM_SETTINGS[f"{prefix}.use_simple_format"],
                repository=repository,
            )
        ),
    )


app_setting_repository = AppSettingRepository()
