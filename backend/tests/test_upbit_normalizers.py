from app.integrations.exchanges.upbit.normalizers import normalize_market


def test_normalize_market_maps_upbit_fields() -> None:
    payload = {
        "market": "KRW-BTC",
        "korean_name": "비트코인",
        "english_name": "Bitcoin",
        "market_event": {
            "warning": True,
            "caution": {
                "PRICE_FLUCTUATIONS": True,
            },
        },
    }

    normalized = normalize_market(payload)

    assert normalized.raw_symbol == "KRW-BTC"
    assert normalized.quote_asset == "KRW"
    assert normalized.base_asset == "BTC"
    assert normalized.display_name_ko == "비트코인"
    assert normalized.display_name_en == "Bitcoin"
    assert normalized.has_warning is True
    assert normalized.warning_flags["warning"] is True
