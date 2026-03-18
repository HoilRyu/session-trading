from app.integrations.exchanges.binance.ticker_normalizers import (
    normalize_rest_ticker_snapshot,
    normalize_ticker_message,
)


def test_normalize_rest_ticker_snapshot_maps_required_fields() -> None:
    payload = {
        "raw_symbol": "USDT-BTC",
        "symbol": "BTCUSDT",
        "lastPrice": "74057.40",
        "priceChangePercent": "0.18",
        "volume": "17621.59514000",
        "quoteVolume": "1306763722.01134320",
        "closeTime": 1773813960024,
    }

    normalized = normalize_rest_ticker_snapshot(payload)

    assert normalized.raw_symbol == "USDT-BTC"
    assert normalized.trade_price == 74057.4
    assert normalized.signed_change_rate == 0.0018
    assert normalized.acc_trade_volume_24h == 17621.59514
    assert normalized.acc_trade_price_24h == 1306763722.0113432
    assert normalized.source_payload["market"] == "USDT-BTC"
    assert normalized.source_payload["acc_trade_price_24h"] == "1306763722.01134320"


def test_normalize_ticker_message_maps_miniticker_payload_to_common_fields() -> None:
    payload = {
        "raw_symbol": "BTC-ETH",
        "s": "ETHBTC",
        "c": "0.05000000",
        "o": "0.04800000",
        "v": "1200.50000000",
        "q": "60.02500000",
        "E": 1773813960002,
    }

    normalized = normalize_ticker_message(payload)

    assert normalized.raw_symbol == "BTC-ETH"
    assert normalized.trade_price == 0.05
    assert normalized.signed_change_rate == 0.041666666666666706
    assert normalized.acc_trade_volume_24h == 1200.5
    assert normalized.acc_trade_price_24h == 60.025
    assert normalized.source_payload["market"] == "BTC-ETH"
    assert normalized.source_payload["acc_trade_volume_24h"] == "1200.50000000"
