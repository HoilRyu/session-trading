from app.integrations.exchanges.binance.websocket import (
    MINI_TICKER_STREAM_NAME,
    build_active_symbol_map,
    resolve_websocket_url,
)


def test_build_active_symbol_map_converts_internal_symbols_to_exchange_symbols() -> None:
    assert build_active_symbol_map(["USDT-BTC", "BTC-ETH"]) == {
        "BTCUSDT": "USDT-BTC",
        "ETHBTC": "BTC-ETH",
    }


def test_resolve_websocket_url_appends_miniticker_stream_path() -> None:
    assert resolve_websocket_url("wss://stream.binance.com:9443") == (
        f"wss://stream.binance.com:9443/ws/{MINI_TICKER_STREAM_NAME}"
    )
    assert resolve_websocket_url(
        f"wss://stream.binance.com:9443/ws/{MINI_TICKER_STREAM_NAME}"
    ) == f"wss://stream.binance.com:9443/ws/{MINI_TICKER_STREAM_NAME}"
