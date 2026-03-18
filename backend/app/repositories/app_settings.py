from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.core.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_setting import AppSetting

SUPPORTED_SETTINGS_EXCHANGES = ("upbit", "bithumb", "binance")

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

DEFAULT_APP_SETTINGS = {
    "general.default_exchange": "upbit",
    "general.default_route": "/market-chart",
    "market_data.default_quote": "KRW",
    "market_data.default_order_by": "trade_amount_24h",
    "market_data.default_order_dir": "desc",
    "market_data.poll_interval_ms": 1000,
    "market_data.auto_refresh_enabled": True,
    "market_data.page_size": 50,
    "market_data.upbit.enabled": True,
    "market_data.bithumb.enabled": True,
    "market_data.binance.enabled": True,
    "chart.default_exchange": "upbit",
    "chart.default_symbol": "KRW-BTC",
    "chart.default_interval": "60",
    "chart.theme": "light",
    "chart.show_volume": True,
    "chart.price_format_mode": "auto",
    "ops.market_sync_on_boot": False,
    "ops.upbit.auto_start": False,
    "ops.bithumb.auto_start": False,
    "ops.binance.auto_start": False,
}

DEFAULT_APP_SETTING_DESCRIPTIONS = {
    "general.default_exchange": "앱 기본 거래소",
    "general.default_route": "앱 기본 진입 경로",
    "market_data.default_quote": "시세 목록 기본 quote",
    "market_data.default_order_by": "시세 목록 기본 정렬 기준",
    "market_data.default_order_dir": "시세 목록 기본 정렬 방향",
    "market_data.poll_interval_ms": "시세 목록 폴링 주기(ms)",
    "market_data.auto_refresh_enabled": "시세 목록 자동 새로고침 여부",
    "market_data.page_size": "시세 목록 기본 페이지 크기",
    "market_data.upbit.enabled": "업비트 목록 노출 여부",
    "market_data.bithumb.enabled": "빗썸 목록 노출 여부",
    "market_data.binance.enabled": "바이낸스 목록 노출 여부",
    "chart.default_exchange": "차트 기본 거래소",
    "chart.default_symbol": "차트 기본 심볼",
    "chart.default_interval": "차트 기본 interval",
    "chart.theme": "차트 기본 테마",
    "chart.show_volume": "차트 거래량 표시 여부",
    "chart.price_format_mode": "차트 가격 표시 모드",
    "ops.market_sync_on_boot": "백엔드 startup 시 마켓 동기화 자동 실행 여부",
    "ops.upbit.auto_start": "백엔드 startup 시 업비트 ticker 자동 시작 여부",
    "ops.bithumb.auto_start": "백엔드 startup 시 빗썸 ticker 자동 시작 여부",
    "ops.binance.auto_start": "백엔드 startup 시 바이낸스 ticker 자동 시작 여부",
}

RESETTABLE_SETTINGS_SECTIONS = ("general", "market_data", "chart")


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

    async def set_setting(
        self,
        session: AsyncSession,
        *,
        key: str,
        value: Any,
        description: str | None = None,
    ) -> AppSetting:
        existing = await self.get_setting_by_key(session, key)
        if existing is None:
            return await self.create_setting(
                session,
                key=key,
                value=value,
                description=description,
            )

        existing.value = value
        if description is not None and hasattr(existing, "description"):
            existing.description = description
        await session.flush()
        return existing


def build_default_app_settings(
    env_settings=None,
) -> dict[str, Any]:
    env_settings = env_settings or get_settings()
    defaults = dict(DEFAULT_APP_SETTINGS)
    for exchange_code in SUPPORTED_SETTINGS_EXCHANGES:
        defaults[f"ops.{exchange_code}.auto_start"] = bool(
            getattr(env_settings, f"{exchange_code}_ticker_auto_start", False)
        )
    return defaults


def _get_setting_description(key: str) -> str | None:
    return DEFAULT_APP_SETTING_DESCRIPTIONS.get(
        key,
        DEFAULT_TICKER_STREAM_SETTING_DESCRIPTIONS.get(key),
    )


async def ensure_default_app_settings(
    session: AsyncSession,
    repository: AppSettingRepository | None = None,
    env_settings=None,
) -> None:
    repository = repository or app_setting_repository
    default_settings = {
        **DEFAULT_TICKER_STREAM_SETTINGS,
        **build_default_app_settings(env_settings),
    }

    for key, value in default_settings.items():
        existing = await repository.get_setting_by_key(session, key)
        if existing is None:
            await repository.create_setting(
                session,
                key=key,
                value=value,
                description=_get_setting_description(key),
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
    if hasattr(setting, "value"):
        return setting.value
    if isinstance(setting, dict):
        return setting.get("value", default)
    return default


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


async def get_settings_document(
    session: AsyncSession,
    *,
    repository: AppSettingRepository | None = None,
    env_settings=None,
) -> dict[str, Any]:
    repository = repository or app_setting_repository
    defaults = build_default_app_settings(env_settings)
    await ensure_default_app_settings(
        session,
        repository=repository,
        env_settings=env_settings,
    )

    return {
        "general": {
            "default_exchange": await get_json_setting(
                session,
                "general.default_exchange",
                default=defaults["general.default_exchange"],
                repository=repository,
            ),
            "default_route": await get_json_setting(
                session,
                "general.default_route",
                default=defaults["general.default_route"],
                repository=repository,
            ),
        },
        "market_data": {
            "default_quote": await get_json_setting(
                session,
                "market_data.default_quote",
                default=defaults["market_data.default_quote"],
                repository=repository,
            ),
            "default_order_by": await get_json_setting(
                session,
                "market_data.default_order_by",
                default=defaults["market_data.default_order_by"],
                repository=repository,
            ),
            "default_order_dir": await get_json_setting(
                session,
                "market_data.default_order_dir",
                default=defaults["market_data.default_order_dir"],
                repository=repository,
            ),
            "poll_interval_ms": int(
                await get_json_setting(
                    session,
                    "market_data.poll_interval_ms",
                    default=defaults["market_data.poll_interval_ms"],
                    repository=repository,
                )
            ),
            "auto_refresh_enabled": bool(
                await get_json_setting(
                    session,
                    "market_data.auto_refresh_enabled",
                    default=defaults["market_data.auto_refresh_enabled"],
                    repository=repository,
                )
            ),
            "page_size": int(
                await get_json_setting(
                    session,
                    "market_data.page_size",
                    default=defaults["market_data.page_size"],
                    repository=repository,
                )
            ),
            "exchanges": {
                exchange_code: {
                    "enabled": bool(
                        await get_json_setting(
                            session,
                            f"market_data.{exchange_code}.enabled",
                            default=defaults[f"market_data.{exchange_code}.enabled"],
                            repository=repository,
                        )
                    )
                }
                for exchange_code in SUPPORTED_SETTINGS_EXCHANGES
            },
        },
        "chart": {
            "default_exchange": await get_json_setting(
                session,
                "chart.default_exchange",
                default=defaults["chart.default_exchange"],
                repository=repository,
            ),
            "default_symbol": await get_json_setting(
                session,
                "chart.default_symbol",
                default=defaults["chart.default_symbol"],
                repository=repository,
            ),
            "default_interval": await get_json_setting(
                session,
                "chart.default_interval",
                default=defaults["chart.default_interval"],
                repository=repository,
            ),
            "theme": await get_json_setting(
                session,
                "chart.theme",
                default=defaults["chart.theme"],
                repository=repository,
            ),
            "show_volume": bool(
                await get_json_setting(
                    session,
                    "chart.show_volume",
                    default=defaults["chart.show_volume"],
                    repository=repository,
                )
            ),
            "price_format_mode": await get_json_setting(
                session,
                "chart.price_format_mode",
                default=defaults["chart.price_format_mode"],
                repository=repository,
            ),
        },
        "ops": await get_startup_ops_settings(
            session,
            repository=repository,
            env_settings=env_settings,
        ),
    }


async def get_startup_ops_settings(
    session: AsyncSession,
    *,
    repository: AppSettingRepository | None = None,
    env_settings=None,
) -> dict[str, Any]:
    repository = repository or app_setting_repository
    defaults = build_default_app_settings(env_settings)
    await ensure_default_app_settings(
        session,
        repository=repository,
        env_settings=env_settings,
    )

    return {
        "market_sync_on_boot": bool(
            await get_json_setting(
                session,
                "ops.market_sync_on_boot",
                default=defaults["ops.market_sync_on_boot"],
                repository=repository,
            )
        ),
        "exchanges": {
            exchange_code: {
                "auto_start": bool(
                    await get_json_setting(
                        session,
                        f"ops.{exchange_code}.auto_start",
                        default=defaults[f"ops.{exchange_code}.auto_start"],
                        repository=repository,
                    )
                ),
                "ticker_enabled": bool(
                    await get_json_setting(
                        session,
                        f"{exchange_code}.ticker.enabled",
                        default=DEFAULT_TICKER_STREAM_SETTINGS[f"{exchange_code}.ticker.enabled"],
                        repository=repository,
                    )
                ),
            }
            for exchange_code in SUPPORTED_SETTINGS_EXCHANGES
        },
    }


async def update_settings_document(
    session: AsyncSession,
    patch: dict[str, Any],
    *,
    repository: AppSettingRepository | None = None,
    env_settings=None,
) -> dict[str, Any]:
    repository = repository or app_setting_repository
    updates = _flatten_settings_patch(patch)
    for key, value in updates.items():
        await repository.set_setting(
            session,
            key=key,
            value=value,
            description=_get_setting_description(key),
        )
    await session.flush()
    return await get_settings_document(
        session,
        repository=repository,
        env_settings=env_settings,
    )


async def reset_settings_section(
    session: AsyncSession,
    section: str,
    *,
    repository: AppSettingRepository | None = None,
    env_settings=None,
) -> dict[str, Any]:
    repository = repository or app_setting_repository
    if section not in RESETTABLE_SETTINGS_SECTIONS:
        raise ValueError(f"지원하지 않는 설정 섹션입니다: {section}")

    defaults = build_default_app_settings(env_settings)
    for key, value in defaults.items():
        if key.startswith(f"{section}."):
            await repository.set_setting(
                session,
                key=key,
                value=value,
                description=_get_setting_description(key),
            )
    await session.flush()
    return await get_settings_document(
        session,
        repository=repository,
        env_settings=env_settings,
    )


def _flatten_settings_patch(patch: dict[str, Any]) -> dict[str, Any]:
    updates: dict[str, Any] = {}

    general = patch.get("general")
    if isinstance(general, dict):
        if "default_exchange" in general:
            updates["general.default_exchange"] = general["default_exchange"]
        if "default_route" in general:
            updates["general.default_route"] = general["default_route"]

    market_data = patch.get("market_data")
    if isinstance(market_data, dict):
        scalar_keys = (
            "default_quote",
            "default_order_by",
            "default_order_dir",
            "poll_interval_ms",
            "auto_refresh_enabled",
            "page_size",
        )
        for key in scalar_keys:
            if key in market_data:
                updates[f"market_data.{key}"] = market_data[key]

        exchanges = market_data.get("exchanges")
        if isinstance(exchanges, dict):
            for exchange_code, values in exchanges.items():
                if exchange_code not in SUPPORTED_SETTINGS_EXCHANGES or not isinstance(values, dict):
                    continue
                if "enabled" in values:
                    updates[f"market_data.{exchange_code}.enabled"] = values["enabled"]

    chart = patch.get("chart")
    if isinstance(chart, dict):
        for key in (
            "default_exchange",
            "default_symbol",
            "default_interval",
            "theme",
            "show_volume",
            "price_format_mode",
        ):
            if key in chart:
                updates[f"chart.{key}"] = chart[key]

    ops = patch.get("ops")
    if isinstance(ops, dict):
        if "market_sync_on_boot" in ops:
            updates["ops.market_sync_on_boot"] = ops["market_sync_on_boot"]

        exchanges = ops.get("exchanges")
        if isinstance(exchanges, dict):
            for exchange_code, values in exchanges.items():
                if exchange_code not in SUPPORTED_SETTINGS_EXCHANGES or not isinstance(values, dict):
                    continue
                if "auto_start" in values:
                    updates[f"ops.{exchange_code}.auto_start"] = values["auto_start"]
                if "ticker_enabled" in values:
                    updates[f"{exchange_code}.ticker.enabled"] = values["ticker_enabled"]

    return updates


app_setting_repository = AppSettingRepository()
