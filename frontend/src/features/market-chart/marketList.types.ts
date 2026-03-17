export type MarketListQuote = 'KRW' | 'BTC' | 'USDT'

export type MarketChartMarketListItem = {
  marketListingId: number
  baseAsset: string
  quoteAsset: string
  displayNameKo?: string
  displayNameEn?: string
  tradePrice: string
  changeRate: string
  volumeText: string
}
