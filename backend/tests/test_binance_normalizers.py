from app.integrations.exchanges.binance.normalizers import (
    normalize_market,
    to_binance_exchange_symbol,
    to_binance_raw_symbol,
)


def test_normalize_market_maps_binance_fields() -> None:
    payload = {
        "symbol": "BTCUSDT",
        "status": "TRADING",
        "baseAsset": "BTC",
        "quoteAsset": "USDT",
        "isSpotTradingAllowed": True,
    }

    normalized = normalize_market(payload)

    assert normalized.raw_symbol == "USDT-BTC"
    assert normalized.base_asset == "BTC"
    assert normalized.quote_asset == "USDT"
    assert normalized.display_name_ko is None
    assert normalized.display_name_en == "BTC"
    assert normalized.exchange_status == "TRADING"


def test_binance_symbol_helpers_convert_between_internal_and_exchange_formats() -> None:
    assert to_binance_raw_symbol(base_asset="ETH", quote_asset="BTC") == "BTC-ETH"
    assert to_binance_exchange_symbol("USDT-BTC") == "BTCUSDT"
