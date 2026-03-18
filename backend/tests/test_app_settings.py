import pytest

from app.repositories.app_settings import (
    DEFAULT_TICKER_STREAM_SETTINGS,
    ensure_default_app_settings,
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

    async def get_setting_by_key(self, session, key: str):
        if key not in self.values:
            return None
        return {"key": key, "value": self.values[key]}

    async def create_setting(self, session, *, key: str, value: object, description: str | None = None):
        self.values[key] = value
        self.created_keys.append(key)
        return {"key": key, "value": value, "description": description}


@pytest.mark.anyio
async def test_ensure_default_app_settings_is_idempotent() -> None:
    session = FakeSession()
    repository = FakeAppSettingRepository()

    await ensure_default_app_settings(session, repository=repository)
    await ensure_default_app_settings(session, repository=repository)

    assert set(repository.values) == set(DEFAULT_TICKER_STREAM_SETTINGS)
    assert repository.created_keys == list(DEFAULT_TICKER_STREAM_SETTINGS)
    assert session.flush_count == 2
