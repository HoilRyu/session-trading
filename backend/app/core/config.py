from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "session-trading-backend"
    environment: str = "local"
    api_v1_prefix: str = ""
    upbit_ticker_auto_start: bool = False
    bithumb_ticker_auto_start: bool = False
    binance_ticker_auto_start: bool = False
    upbit_api_base_url: str = "https://api.upbit.com"
    upbit_websocket_url: str = "wss://api.upbit.com/websocket/v1"
    upbit_request_timeout_sec: float = 10.0
    upbit_ticker_stream_type: str = "ticker"
    bithumb_api_base_url: str = "https://api.bithumb.com"
    bithumb_websocket_url: str = "wss://pubwss.bithumb.com/pub/ws"
    bithumb_request_timeout_sec: float = 10.0
    binance_api_base_url: str = "https://api.binance.com"
    binance_websocket_url: str = "wss://stream.binance.com:9443"
    binance_request_timeout_sec: float = 10.0
    db_host: str = "127.0.0.1"
    db_port: int = 5432
    db_name: str = "session_trading"
    db_user: str = "session_trading"
    db_password: str = "session_trading"
    cors_allowed_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
