from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator


SettingsExchangeCode = Literal["upbit", "bithumb", "binance"]
SettingsDefaultRoute = Literal[
    "/dashboard",
    "/investment-status",
    "/market-chart",
    "/settings",
]
SettingsQuote = Literal["KRW", "BTC", "USDT"]
SettingsOrderBy = Literal["name", "price", "change_rate", "volume_24h", "trade_amount_24h"]
SettingsOrderDir = Literal["asc", "desc"]
SettingsChartTheme = Literal["light", "dark"]
SettingsChartPriceFormatMode = Literal["auto", "compact"]
SettingsChartInterval = Literal["1", "3", "5", "15", "30", "60", "240", "1D"]

SUPPORTED_QUOTES_BY_EXCHANGE: dict[str, tuple[str, ...]] = {
    "upbit": ("KRW", "BTC", "USDT"),
    "bithumb": ("KRW", "BTC"),
    "binance": ("USDT", "BTC"),
}


class SettingsExchangeEnabled(BaseModel):
    enabled: bool


class SettingsExchangeEnabledPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: bool | None = None


class SettingsOpsExchange(BaseModel):
    auto_start: bool
    ticker_enabled: bool


class SettingsOpsExchangePatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    auto_start: bool | None = None
    ticker_enabled: bool | None = None


class SettingsGeneral(BaseModel):
    default_exchange: SettingsExchangeCode
    default_route: SettingsDefaultRoute


class SettingsMarketData(BaseModel):
    default_quote: SettingsQuote
    default_order_by: SettingsOrderBy
    default_order_dir: SettingsOrderDir
    poll_interval_ms: int = Field(ge=1000, le=10000)
    auto_refresh_enabled: bool
    page_size: int = Field(ge=20, le=100)
    exchanges: dict[SettingsExchangeCode, SettingsExchangeEnabled]


class SettingsChart(BaseModel):
    default_exchange: SettingsExchangeCode
    default_symbol: str
    default_interval: SettingsChartInterval
    theme: SettingsChartTheme
    show_volume: bool
    price_format_mode: SettingsChartPriceFormatMode


class SettingsOps(BaseModel):
    market_sync_on_boot: bool
    exchanges: dict[SettingsExchangeCode, SettingsOpsExchange]


class SettingsDocument(BaseModel):
    model_config = ConfigDict(extra="forbid")

    general: SettingsGeneral
    market_data: SettingsMarketData
    chart: SettingsChart
    ops: SettingsOps

    @model_validator(mode="after")
    def validate_cross_field_rules(self):
        enabled_exchanges = {
            exchange_code
            for exchange_code, config in self.market_data.exchanges.items()
            if config.enabled
        }

        if not enabled_exchanges:
            raise ValueError("최소 한 개 이상의 거래소를 활성화해야 합니다.")

        if self.general.default_exchange not in enabled_exchanges:
            raise ValueError(
                f"general.default_exchange는 활성화된 거래소여야 합니다: {self.general.default_exchange}"
            )

        if self.chart.default_exchange not in enabled_exchanges:
            raise ValueError(
                f"chart.default_exchange는 활성화된 거래소여야 합니다: {self.chart.default_exchange}"
            )

        default_exchange = self.general.default_exchange
        if self.market_data.default_quote not in SUPPORTED_QUOTES_BY_EXCHANGE[default_exchange]:
            raise ValueError(
                f"{default_exchange} 거래소는 {self.market_data.default_quote} quote를 지원하지 않습니다."
            )

        if self.chart.default_exchange != self.general.default_exchange:
            raise ValueError("chart.default_exchange는 general.default_exchange와 같아야 합니다.")

        if not _is_symbol_supported_for_exchange(
            self.chart.default_exchange,
            self.chart.default_symbol,
        ):
            raise ValueError(
                f"{self.chart.default_exchange} 거래소와 호환되지 않는 기본 심볼입니다: {self.chart.default_symbol}"
            )

        chart_quote = _get_symbol_quote_for_exchange(
            self.chart.default_exchange,
            self.chart.default_symbol,
        )
        if chart_quote != self.market_data.default_quote:
            raise ValueError(
                "chart.default_symbol은 현재 기본 quote와 호환되는 심볼이어야 합니다."
            )

        for exchange_code, config in self.ops.exchanges.items():
            if config.auto_start and not config.ticker_enabled:
                raise ValueError(
                    f"ops.{exchange_code}.auto_start를 사용하려면 ticker_enabled가 활성화돼야 합니다."
                )

        return self


class SettingsGeneralPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    default_exchange: str | None = None
    default_route: str | None = None


class SettingsMarketDataPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    default_quote: str | None = None
    default_order_by: str | None = None
    default_order_dir: str | None = None
    poll_interval_ms: int | None = None
    auto_refresh_enabled: bool | None = None
    page_size: int | None = None
    exchanges: dict[str, SettingsExchangeEnabledPatch] | None = None


class SettingsChartPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    default_exchange: str | None = None
    default_symbol: str | None = None
    default_interval: str | None = None
    theme: str | None = None
    show_volume: bool | None = None
    price_format_mode: str | None = None


class SettingsOpsPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    market_sync_on_boot: bool | None = None
    exchanges: dict[str, SettingsOpsExchangePatch] | None = None


class SettingsPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    general: SettingsGeneralPatch | None = None
    market_data: SettingsMarketDataPatch | None = None
    chart: SettingsChartPatch | None = None
    ops: SettingsOpsPatch | None = None


class SettingsResetRequest(BaseModel):
    section: str


class SettingsRuntimeExchangeStatus(BaseModel):
    status: str
    subscribed_market_count: int
    buffered_event_count: int
    last_received_at: datetime | None
    last_flushed_at: datetime | None
    last_error: str | None


class SettingsRuntimeResponse(BaseModel):
    environment: str
    backend_status: str
    target: str
    exchanges: dict[SettingsExchangeCode, SettingsRuntimeExchangeStatus]


def validate_settings_document(document: dict) -> SettingsDocument:
    return SettingsDocument.model_validate(document)


def format_settings_validation_error(exc: ValidationError) -> str:
    first_error = exc.errors()[0]
    location = ".".join(str(part) for part in first_error.get("loc", ()))
    message = first_error.get("msg", "유효하지 않은 설정입니다.")
    if location:
        return f"{location}: {message}"
    return message


def _is_symbol_supported_for_exchange(exchange: str, raw_symbol: str) -> bool:
    supported_quotes = SUPPORTED_QUOTES_BY_EXCHANGE.get(exchange)
    if supported_quotes is None:
        return False

    if exchange in ("upbit", "bithumb"):
        if "-" not in raw_symbol:
            return False
        quote_asset, base_asset = raw_symbol.split("-", maxsplit=1)
        return bool(base_asset) and quote_asset in supported_quotes

    if "-" in raw_symbol or not raw_symbol.isascii() or not raw_symbol.isalnum():
        return False

    return any(
        raw_symbol.endswith(quote_asset) and raw_symbol != quote_asset
        for quote_asset in supported_quotes
    )


def _get_symbol_quote_for_exchange(exchange: str, raw_symbol: str) -> str | None:
    supported_quotes = SUPPORTED_QUOTES_BY_EXCHANGE.get(exchange)
    if supported_quotes is None:
        return None

    if exchange in ("upbit", "bithumb"):
        if "-" not in raw_symbol:
            return None
        quote_asset, _ = raw_symbol.split("-", maxsplit=1)
        return quote_asset if quote_asset in supported_quotes else None

    for quote_asset in supported_quotes:
        if raw_symbol.endswith(quote_asset) and raw_symbol != quote_asset:
            return quote_asset

    return None
