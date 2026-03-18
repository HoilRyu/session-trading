export type MarketListExchange = 'upbit' | 'bithumb' | 'binance'
export type MarketListQuote = 'KRW' | 'BTC' | 'USDT'

export type MarketListOrderBy =
  | 'name'
  | 'price'
  | 'change_rate'
  | 'volume_24h'
  | 'trade_amount_24h'

export type MarketListOrderDir = 'asc' | 'desc'

export type MarketListSortState = {
  orderBy: MarketListOrderBy
  orderDir: MarketListOrderDir
}

export const DEFAULT_MARKET_LIST_SORT: MarketListSortState = {
  orderBy: 'name',
  orderDir: 'asc',
}

export const SUPPORTED_MARKET_QUOTES_BY_EXCHANGE: Record<
  MarketListExchange,
  MarketListQuote[]
> = {
  upbit: ['KRW', 'BTC', 'USDT'],
  bithumb: ['KRW', 'BTC'],
  binance: ['USDT', 'BTC'],
}

export function getExchangeDisplayName(exchange: MarketListExchange) {
  switch (exchange) {
    case 'upbit':
      return '업비트'
    case 'bithumb':
      return '빗썸'
    case 'binance':
      return '바이낸스'
  }
}

export function getSupportedQuotes(exchange: MarketListExchange) {
  return SUPPORTED_MARKET_QUOTES_BY_EXCHANGE[exchange]
}

export function getDefaultQuoteForExchange(exchange: MarketListExchange) {
  return getSupportedQuotes(exchange)[0] ?? 'KRW'
}

export function isQuoteSupported(
  exchange: MarketListExchange,
  quote: MarketListQuote,
) {
  return getSupportedQuotes(exchange).includes(quote)
}

export function getDefaultOrderDir(orderBy: MarketListOrderBy): MarketListOrderDir {
  return orderBy === 'name' ? 'asc' : 'desc'
}

export function toggleMarketListSort(
  currentSort: MarketListSortState,
  nextOrderBy: MarketListOrderBy,
): MarketListSortState {
  if (currentSort.orderBy === nextOrderBy) {
    return {
      orderBy: nextOrderBy,
      orderDir: currentSort.orderDir === 'asc' ? 'desc' : 'asc',
    }
  }

  return {
    orderBy: nextOrderBy,
    orderDir: getDefaultOrderDir(nextOrderBy),
  }
}

export type MarketChartMarketListItem = {
  marketListingId: number
  chartSymbol: string
  baseAsset: string
  quoteAsset: string
  displayNameKo?: string
  displayNameEn?: string
  tradePrice: string
  changeRate: string
  volumeText: string
}
