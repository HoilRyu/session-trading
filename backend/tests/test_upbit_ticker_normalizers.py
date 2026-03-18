from app.integrations.exchanges.upbit.ticker_normalizers import normalize_ticker_message


def test_normalize_ticker_message_maps_required_fields() -> None:
    payload = {
        "code": "KRW-BTC",
        "trade_price": 123456789,
        "signed_change_rate": 0.0123,
        "acc_trade_volume_24h": 9999.1,
        "acc_trade_price_24h": 228827082484.35,
        "trade_timestamp": 1710660000000,
    }

    normalized = normalize_ticker_message(payload)

    assert normalized.raw_symbol == "KRW-BTC"
    assert normalized.trade_price == 123456789
    assert normalized.signed_change_rate == 0.0123
    assert normalized.acc_trade_volume_24h == 9999.1
    assert normalized.acc_trade_price_24h == 228827082484.35
    assert normalized.source_payload == payload
