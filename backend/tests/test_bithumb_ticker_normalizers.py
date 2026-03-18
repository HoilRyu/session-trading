from app.integrations.exchanges.bithumb.ticker_normalizers import (
    normalize_rest_ticker_snapshot,
    normalize_ticker_message,
)


def test_normalize_rest_ticker_snapshot_maps_required_fields() -> None:
    payload = {
        "market": "KRW-BTC",
        "trade_price": 109598000,
        "signed_change_rate": -0.0011,
        "acc_trade_volume_24h": 686.14358703,
        "acc_trade_price_24h": 75059041272.66624,
        "trade_timestamp": 1773842793586,
    }

    normalized = normalize_rest_ticker_snapshot(payload)

    assert normalized.raw_symbol == "KRW-BTC"
    assert normalized.trade_price == 109598000
    assert normalized.signed_change_rate == -0.0011
    assert normalized.acc_trade_volume_24h == 686.14358703
    assert normalized.acc_trade_price_24h == 75059041272.66624
    assert normalized.source_payload["acc_trade_price_24h"] == 75059041272.66624


def test_normalize_ticker_message_maps_websocket_payload_to_common_fields() -> None:
    payload = {
        "type": "ticker",
        "content": {
            "symbol": "BTC_KRW",
            "closePrice": "109598000",
            "prevClosePrice": "109720000",
            "volume": "686.14358703",
            "value": "75059041272.66624",
            "date": "20260318",
            "time": "140633",
        },
    }

    normalized = normalize_ticker_message(payload)

    assert normalized.raw_symbol == "KRW-BTC"
    assert normalized.trade_price == 109598000
    assert normalized.signed_change_rate < 0
    assert normalized.acc_trade_volume_24h == 686.14358703
    assert normalized.acc_trade_price_24h == 75059041272.66624
    assert normalized.source_payload["market"] == "KRW-BTC"
    assert normalized.source_payload["acc_trade_price_24h"] == "75059041272.66624"
