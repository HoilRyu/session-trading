from app.integrations.exchanges.bithumb.websocket import (
    build_ticker_subscribe_payload,
    to_bithumb_websocket_symbol,
)


def test_to_bithumb_websocket_symbol_converts_to_base_quote_format() -> None:
    assert to_bithumb_websocket_symbol("KRW-BTC") == "BTC_KRW"
    assert to_bithumb_websocket_symbol("BTC-XRP") == "XRP_BTC"


def test_build_ticker_subscribe_payload_uses_24h_tick_type() -> None:
    payload = build_ticker_subscribe_payload(["KRW-BTC", "BTC-XRP"])

    assert payload == {
        "type": "ticker",
        "symbols": ["BTC_KRW", "XRP_BTC"],
        "tickTypes": ["24H"],
    }
