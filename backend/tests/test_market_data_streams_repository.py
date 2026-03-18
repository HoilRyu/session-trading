from app.repositories.market_data_streams import _is_ascii_market_symbol


def test_is_ascii_market_symbol_rejects_non_ascii_pairs() -> None:
    assert _is_ascii_market_symbol("USDT-BTC") is True
    assert _is_ascii_market_symbol("USDT-币安人生") is False
