from types import SimpleNamespace

import pytest

from app.repositories.app_settings import (
    DEFAULT_APP_SETTINGS,
    DEFAULT_TICKER_STREAM_SETTINGS,
    ensure_default_app_settings,
    get_settings_document,
    reset_settings_section,
    update_settings_document,
)


class FakeSession:
    def __init__(self) -> None:
        self.flush_count = 0

    async def flush(self) -> None:
        self.flush_count += 1


class FakeAppSettingRepository:
    def __init__(self) -> None:
        self.values: dict[str, object] = {}
        self.created_keys: list[str] = []
        self.updated_keys: list[str] = []

    async def get_setting_by_key(self, session, key: str):
        if key not in self.values:
            return None
        return {"key": key, "value": self.values[key]}

    async def create_setting(self, session, *, key: str, value: object, description: str | None = None):
        self.values[key] = value
        self.created_keys.append(key)
        return {"key": key, "value": value, "description": description}

    async def set_setting(self, session, *, key: str, value: object, description: str | None = None):
        if key not in self.values:
            return await self.create_setting(session, key=key, value=value, description=description)

        self.values[key] = value
        self.updated_keys.append(key)
        return {"key": key, "value": value, "description": description}


@pytest.mark.anyio
async def test_ensure_default_app_settings_is_idempotent() -> None:
    session = FakeSession()
    repository = FakeAppSettingRepository()
    env_settings = SimpleNamespace(
        upbit_ticker_auto_start=True,
        bithumb_ticker_auto_start=False,
        binance_ticker_auto_start=True,
    )

    await ensure_default_app_settings(session, repository=repository, env_settings=env_settings)
    await ensure_default_app_settings(session, repository=repository, env_settings=env_settings)

    assert set(repository.values) == set(DEFAULT_TICKER_STREAM_SETTINGS) | set(DEFAULT_APP_SETTINGS)
    assert repository.values["ops.upbit.auto_start"] is True
    assert repository.values["ops.bithumb.auto_start"] is False
    assert repository.values["ops.binance.auto_start"] is True
    assert repository.created_keys == [
        *list(DEFAULT_TICKER_STREAM_SETTINGS),
        *list(DEFAULT_APP_SETTINGS),
    ]
    assert session.flush_count == 2


@pytest.mark.anyio
async def test_get_settings_document_returns_section_structure() -> None:
    session = FakeSession()
    repository = FakeAppSettingRepository()
    env_settings = SimpleNamespace(
        upbit_ticker_auto_start=False,
        bithumb_ticker_auto_start=False,
        binance_ticker_auto_start=False,
    )

    await ensure_default_app_settings(session, repository=repository, env_settings=env_settings)

    document = await get_settings_document(
        session,
        repository=repository,
        env_settings=env_settings,
    )

    assert document == {
        "general": {
            "default_exchange": "upbit",
            "default_route": "/market-chart",
        },
        "market_data": {
            "default_quote": "KRW",
            "default_order_by": "trade_amount_24h",
            "default_order_dir": "desc",
            "poll_interval_ms": 1000,
            "auto_refresh_enabled": True,
            "page_size": 50,
            "exchanges": {
                "upbit": {"enabled": True},
                "bithumb": {"enabled": True},
                "binance": {"enabled": True},
            },
        },
        "chart": {
            "default_exchange": "upbit",
            "default_symbol": "KRW-BTC",
            "default_interval": "60",
            "theme": "light",
            "show_volume": True,
            "price_format_mode": "auto",
        },
        "ops": {
            "market_sync_on_boot": False,
            "exchanges": {
                "upbit": {"auto_start": False, "ticker_enabled": True},
                "bithumb": {"auto_start": False, "ticker_enabled": True},
                "binance": {"auto_start": False, "ticker_enabled": True},
            },
        },
    }


@pytest.mark.anyio
async def test_update_settings_document_only_changes_requested_keys() -> None:
    session = FakeSession()
    repository = FakeAppSettingRepository()
    env_settings = SimpleNamespace(
        upbit_ticker_auto_start=False,
        bithumb_ticker_auto_start=False,
        binance_ticker_auto_start=False,
    )

    await ensure_default_app_settings(session, repository=repository, env_settings=env_settings)

    updated = await update_settings_document(
        session,
        {
            "market_data": {
                "poll_interval_ms": 2000,
                "auto_refresh_enabled": False,
            },
            "ops": {
                "exchanges": {
                    "binance": {
                        "auto_start": True,
                    },
                    "bithumb": {
                        "ticker_enabled": False,
                    }
                }
            },
        },
        repository=repository,
        env_settings=env_settings,
    )

    assert updated["market_data"]["poll_interval_ms"] == 2000
    assert updated["market_data"]["auto_refresh_enabled"] is False
    assert updated["market_data"]["default_quote"] == "KRW"
    assert updated["ops"]["exchanges"]["binance"] == {
        "auto_start": True,
        "ticker_enabled": True,
    }
    assert updated["ops"]["exchanges"]["bithumb"] == {
        "auto_start": False,
        "ticker_enabled": False,
    }
    assert repository.values["bithumb.ticker.enabled"] is False
    assert repository.values["ops.binance.auto_start"] is True
    assert "market_data.poll_interval_ms" in repository.updated_keys
    assert "market_data.auto_refresh_enabled" in repository.updated_keys
    assert "bithumb.ticker.enabled" in repository.updated_keys
    assert "ops.binance.auto_start" in repository.updated_keys


@pytest.mark.anyio
async def test_reset_settings_section_restores_defaults_without_touching_other_sections() -> None:
    session = FakeSession()
    repository = FakeAppSettingRepository()
    env_settings = SimpleNamespace(
        upbit_ticker_auto_start=False,
        bithumb_ticker_auto_start=False,
        binance_ticker_auto_start=False,
    )

    await ensure_default_app_settings(session, repository=repository, env_settings=env_settings)
    await update_settings_document(
        session,
        {
            "chart": {
                "default_exchange": "binance",
                "default_symbol": "BTCUSDT",
                "theme": "dark",
            },
            "market_data": {
                "poll_interval_ms": 3000,
            },
        },
        repository=repository,
        env_settings=env_settings,
    )

    reset = await reset_settings_section(
        session,
        "chart",
        repository=repository,
        env_settings=env_settings,
    )

    assert reset["chart"] == {
        "default_exchange": "upbit",
        "default_symbol": "KRW-BTC",
        "default_interval": "60",
        "theme": "light",
        "show_volume": True,
        "price_format_mode": "auto",
    }
    assert reset["market_data"]["poll_interval_ms"] == 3000
