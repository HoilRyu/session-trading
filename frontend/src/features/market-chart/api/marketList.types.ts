import type {
  MarketListExchange,
  MarketListOrderBy,
  MarketListOrderDir,
  MarketListQuote,
} from '../marketList.types'

export type MarketListApiItem = {
  market_listing_id: number
  exchange: string
  raw_symbol: string
  base_asset: string
  quote_asset: string
  display_name_ko: string | null
  display_name_en: string | null
  has_warning: boolean
  trade_price: string | null
  signed_change_rate: string | null
  acc_trade_volume_24h: string | null
  acc_trade_price_24h?: string | null
  event_time: string | null
}

export type MarketListApiResponse = {
  start: number
  limit: number
  total: number
  refreshed_at: string
  items: MarketListApiItem[]
}

export type MarketListQueryParams = {
  exchange?: MarketListExchange
  quote?: MarketListQuote
  start?: number
  limit?: number
  orderBy?: MarketListOrderBy
  orderDir?: MarketListOrderDir
}
