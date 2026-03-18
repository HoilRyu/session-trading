import { mapMarketListItem } from './marketListMapper'

describe('mapMarketListItem', () => {
  it('API 응답을 UI 아이템으로 변환한다', () => {
    const item = mapMarketListItem({
      market_listing_id: 1,
      exchange: 'upbit',
      raw_symbol: 'KRW-BTC',
      base_asset: 'BTC',
      quote_asset: 'KRW',
      display_name_ko: '비트코인',
      display_name_en: 'Bitcoin',
      has_warning: false,
      trade_price: '109131000.00000000',
      signed_change_rate: '-0.0084',
      acc_trade_volume_24h: '422181000.00000000',
      acc_trade_price_24h: '228827082484.35990000',
      event_time: null,
    })

    expect(item.marketListingId).toBe(1)
    expect(item.chartSymbol).toBe('UPBIT:BTCKRW')
    expect(item.displayNameKo).toBe('비트코인')
    expect(item.displayNameEn).toBe('Bitcoin')
    expect(item.tradePrice).toBe('109,131,000')
    expect(item.changeRate).toBe('-0.84%')
    expect(item.volumeText).toBe('228,827,082,484.36')
  })

  it('종목명 fallback과 심볼 규칙을 유지한다', () => {
    const englishOnly = mapMarketListItem({
      market_listing_id: 2,
      exchange: 'binance',
      raw_symbol: 'BTCUSDT',
      base_asset: 'BTC',
      quote_asset: 'USDT',
      display_name_ko: null,
      display_name_en: 'Bitcoin',
      has_warning: false,
      trade_price: '84000',
      signed_change_rate: '0.01234',
      acc_trade_volume_24h: '1200',
      acc_trade_price_24h: '100800000',
      event_time: null,
    })

    expect(englishOnly.displayNameKo).toBeUndefined()
    expect(englishOnly.displayNameEn).toBe('Bitcoin')
    expect(englishOnly.chartSymbol).toBe('BINANCE:BTCUSDT')
    expect(englishOnly.baseAsset).toBe('BTC')
    expect(englishOnly.quoteAsset).toBe('USDT')
    expect(englishOnly.changeRate).toBe('+1.23%')

    const fallback = mapMarketListItem({
      market_listing_id: 3,
      exchange: 'binance',
      raw_symbol: 'SOLBTC',
      base_asset: 'SOL',
      quote_asset: 'BTC',
      display_name_ko: null,
      display_name_en: null,
      has_warning: false,
      trade_price: null,
      signed_change_rate: null,
      acc_trade_volume_24h: null,
      acc_trade_price_24h: null,
      event_time: null,
    })

    expect(fallback.displayNameKo).toBeUndefined()
    expect(fallback.displayNameEn).toBeUndefined()
    expect(fallback.chartSymbol).toBe('BINANCE:SOLBTC')
    expect(fallback.baseAsset).toBe('SOL')
    expect(fallback.tradePrice).toBe('-')
    expect(fallback.changeRate).toBe('-')
    expect(fallback.volumeText).toBe('-')
  })

  it('BTC 마켓의 매우 작은 가격도 0으로 보이지 않게 유지한다', () => {
    const tinyPrice = mapMarketListItem({
      market_listing_id: 4,
      exchange: 'upbit',
      raw_symbol: 'BTC-GAME2',
      base_asset: 'GAME2',
      quote_asset: 'BTC',
      display_name_ko: '게임투',
      display_name_en: 'Game2',
      has_warning: false,
      trade_price: '2E-8',
      signed_change_rate: '0E-10',
      acc_trade_volume_24h: '0E-10',
      acc_trade_price_24h: '52.93',
      event_time: null,
    })

    expect(tinyPrice.tradePrice).toBe('0.00000002')
    expect(tinyPrice.changeRate).toBe('0.00%')
    expect(tinyPrice.volumeText).toBe('52.93')
    expect(tinyPrice.chartSymbol).toBe('UPBIT:GAME2BTC')
  })
})
