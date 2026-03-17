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
      event_time: null,
    })

    expect(item.marketListingId).toBe(1)
    expect(item.displayNameKo).toBe('비트코인')
    expect(item.displayNameEn).toBe('Bitcoin')
    expect(item.tradePrice).toBe('109,131,000')
    expect(item.changeRate).toBe('-0.84%')
    expect(item.volumeText).toBe('422,181,000')
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
      event_time: null,
    })

    expect(englishOnly.displayNameKo).toBeUndefined()
    expect(englishOnly.displayNameEn).toBe('Bitcoin')
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
      event_time: null,
    })

    expect(fallback.displayNameKo).toBeUndefined()
    expect(fallback.displayNameEn).toBeUndefined()
    expect(fallback.baseAsset).toBe('SOL')
    expect(fallback.tradePrice).toBe('-')
    expect(fallback.changeRate).toBe('-')
    expect(fallback.volumeText).toBe('-')
  })
})
