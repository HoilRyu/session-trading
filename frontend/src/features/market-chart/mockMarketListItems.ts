import type { MarketChartMarketListItem } from './marketList.types'

export const MOCK_MARKET_LIST_ITEMS: MarketChartMarketListItem[] = [
  {
    marketListingId: 1,
    baseAsset: 'BTC',
    quoteAsset: 'KRW',
    displayNameKo: '비트코인',
    displayNameEn: 'Bitcoin',
    tradePrice: '109,131,000',
    changeRate: '-0.84%',
    volumeText: '422,181백만',
  },
  {
    marketListingId: 2,
    baseAsset: 'ETH',
    quoteAsset: 'KRW',
    displayNameKo: '이더리움',
    displayNameEn: 'Ethereum',
    tradePrice: '3,426,000',
    changeRate: '-1.01%',
    volumeText: '351,296백만',
  },
  {
    marketListingId: 3,
    baseAsset: 'XRP',
    quoteAsset: 'KRW',
    displayNameKo: '리플',
    displayNameEn: 'XRP',
    tradePrice: '2,235',
    changeRate: '-1.50%',
    volumeText: '681,492백만',
  },
  {
    marketListingId: 4,
    baseAsset: 'SOL',
    quoteAsset: 'KRW',
    displayNameKo: '솔라나',
    displayNameEn: 'Solana',
    tradePrice: '138,400',
    changeRate: '-2.19%',
    volumeText: '121,383백만',
  },
]
