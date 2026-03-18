import type { MarketChartMarketListItem } from '../marketList.types'
import type { MarketListApiItem, MarketListApiResponse } from './marketList.types'

function formatChartSymbol({
  exchange,
  raw_symbol: rawSymbol,
  base_asset: baseAsset,
  quote_asset: quoteAsset,
}: Pick<
  MarketListApiItem,
  'exchange' | 'raw_symbol' | 'base_asset' | 'quote_asset'
>) {
  const exchangePrefix = exchange.toUpperCase()
  const [rawQuoteAsset, rawBaseAsset] = rawSymbol.split('-')

  if (rawQuoteAsset && rawBaseAsset) {
    return `${exchangePrefix}:${rawBaseAsset}${rawQuoteAsset}`
  }

  return `${exchangePrefix}:${baseAsset}${quoteAsset}`
}

function parseNumericString(value: string | null) {
  if (!value) {
    return null
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed
}

function formatNumberString(value: string | null) {
  const parsed = parseNumericString(value)

  if (parsed === null) {
    return '-'
  }

  return parsed.toLocaleString('ko-KR', {
    maximumFractionDigits: parsed % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  })
}

function formatTradePrice(value: string | null) {
  const parsed = parseNumericString(value)

  if (parsed === null) {
    return '-'
  }

  const absolute = Math.abs(parsed)
  let maximumFractionDigits = 0

  if (!Number.isInteger(parsed)) {
    if (absolute >= 1) {
      maximumFractionDigits = 2
    } else if (absolute >= 0.01) {
      maximumFractionDigits = 4
    } else if (absolute >= 0.0001) {
      maximumFractionDigits = 6
    } else {
      maximumFractionDigits = 8
    }
  }

  return parsed.toLocaleString('ko-KR', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  })
}

function formatChangeRate(value: string | null) {
  const parsed = parseNumericString(value)

  if (parsed === null) {
    return '-'
  }

  const percent = parsed * 100
  const sign = percent > 0 ? '+' : ''

  return `${sign}${percent.toFixed(2)}%`
}

export function mapMarketListItem(item: MarketListApiItem): MarketChartMarketListItem {
  return {
    marketListingId: item.market_listing_id,
    chartSymbol: formatChartSymbol(item),
    baseAsset: item.base_asset,
    quoteAsset: item.quote_asset,
    displayNameKo: item.display_name_ko ?? undefined,
    displayNameEn: item.display_name_en ?? undefined,
    tradePrice: formatTradePrice(item.trade_price),
    changeRate: formatChangeRate(item.signed_change_rate),
    volumeText: formatNumberString(
      item.acc_trade_price_24h ?? item.acc_trade_volume_24h,
    ),
  }
}

export function mapMarketListResponse(response: MarketListApiResponse) {
  return response.items.map(mapMarketListItem)
}
