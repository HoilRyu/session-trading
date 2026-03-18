from app.integrations.exchanges.upbit.ticker_normalizers import (
    normalize_rest_ticker_snapshot,
)


def test_normalize_rest_ticker_snapshot_maps_required_fields() -> None:
    payload = {
        "market": "KRW-BTC",
        "trade_price": 100.5,
        "signed_change_rate": 0.01,
        "acc_trade_volume_24h": 1000.0,
        "acc_trade_price_24h": 228827082484.35,
        "trade_timestamp": 1710660000000,
    }

    normalized = normalize_rest_ticker_snapshot(payload)

    assert normalized.raw_symbol == "KRW-BTC"
    assert normalized.trade_price == 100.5
    assert normalized.acc_trade_price_24h == 228827082484.35
    assert normalized.source_payload == payload
