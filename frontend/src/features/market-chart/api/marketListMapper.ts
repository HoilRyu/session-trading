import type { MarketChartMarketListItem } from '../marketList.types'
import type { MarketListApiItem, MarketListApiResponse } from './marketList.types'

function formatNumberString(value: string | null) {
  if (!value) {
    return '-'
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return '-'
  }

  return parsed.toLocaleString('ko-KR', {
    maximumFractionDigits: parsed % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  })
}

function formatChangeRate(value: string | null) {
  if (!value) {
    return '-'
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return '-'
  }

  const percent = parsed * 100
  const sign = percent > 0 ? '+' : ''

  return `${sign}${percent.toFixed(2)}%`
}

export function mapMarketListItem(item: MarketListApiItem): MarketChartMarketListItem {
  return {
    marketListingId: item.market_listing_id,
    baseAsset: item.base_asset,
    quoteAsset: item.quote_asset,
    displayNameKo: item.display_name_ko ?? undefined,
    displayNameEn: item.display_name_en ?? undefined,
    tradePrice: formatNumberString(item.trade_price),
    changeRate: formatChangeRate(item.signed_change_rate),
    volumeText: formatNumberString(item.acc_trade_volume_24h),
  }
}

export function mapMarketListResponse(response: MarketListApiResponse) {
  return response.items.map(mapMarketListItem)
}
