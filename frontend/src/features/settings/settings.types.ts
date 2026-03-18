import type {
  MarketListExchange,
  MarketListOrderBy,
  MarketListOrderDir,
  MarketListQuote,
} from '../market-chart/marketList.types'

export type SettingsDefaultRoute =
  | '/dashboard'
  | '/investment-status'
  | '/market-chart'
  | '/settings'

export type SettingsChartInterval = '1' | '3' | '5' | '15' | '30' | '60' | '240' | '1D'
export type SettingsChartTheme = 'light' | 'dark'
export type SettingsPriceFormatMode = 'auto' | 'compact'

export type SettingsGeneralSection = {
  default_exchange: MarketListExchange
  default_route: SettingsDefaultRoute
}

export type SettingsMarketDataExchangeConfig = {
  enabled: boolean
}

export type SettingsMarketDataSection = {
  default_quote: MarketListQuote
  default_order_by: MarketListOrderBy
  default_order_dir: MarketListOrderDir
  poll_interval_ms: number
  auto_refresh_enabled: boolean
  page_size: number
  exchanges: Record<MarketListExchange, SettingsMarketDataExchangeConfig>
}

export type SettingsChartSection = {
  default_exchange: MarketListExchange
  default_symbol: string
  default_interval: SettingsChartInterval
  theme: SettingsChartTheme
  show_volume: boolean
  price_format_mode: SettingsPriceFormatMode
}

export type SettingsOpsExchangeConfig = {
  auto_start: boolean
  ticker_enabled: boolean
}

export type SettingsOpsSection = {
  market_sync_on_boot: boolean
  exchanges: Record<MarketListExchange, SettingsOpsExchangeConfig>
}

export type ServerSettingsDocument = {
  general: SettingsGeneralSection
  market_data: SettingsMarketDataSection
  chart: SettingsChartSection
  ops: SettingsOpsSection
}

export type ResettableSettingsSection = 'general' | 'market_data' | 'chart'
export type SettingsFormSectionKey = keyof ServerSettingsDocument
export type SettingsEditableSectionKey = Exclude<SettingsFormSectionKey, never>

export type SettingsUpdatePayload = Partial<{
  general: Partial<SettingsGeneralSection>
  market_data: Partial<SettingsMarketDataSection>
  chart: Partial<SettingsChartSection>
  ops: Partial<SettingsOpsSection>
}>

export type SettingsRuntimeExchangeStatus = {
  status: 'running' | 'stopped' | 'unavailable'
  subscribed_market_count: number
  buffered_event_count: number
  last_error: string | null
  last_received_at: string | null
  last_flushed_at: string | null
}

export type SettingsRuntimeDocument = {
  environment: string
  backend_status: 'online' | 'offline' | 'checking'
  target: string
  exchanges: Record<MarketListExchange, SettingsRuntimeExchangeStatus>
}

export type SettingsOperationStatus = 'idle' | 'pending' | 'success' | 'error'

export type SettingsOperationState = {
  status: SettingsOperationStatus
  message: string | null
}

export type SettingsOperationStateMap = Partial<
  Record<string, SettingsOperationState>
>

export const SETTINGS_EXCHANGES: MarketListExchange[] = [
  'upbit',
  'bithumb',
  'binance',
]

export const SETTINGS_DEFAULT_DOCUMENT: ServerSettingsDocument = {
  general: {
    default_exchange: 'upbit',
    default_route: '/market-chart',
  },
  market_data: {
    default_quote: 'KRW',
    default_order_by: 'trade_amount_24h',
    default_order_dir: 'desc',
    poll_interval_ms: 1000,
    auto_refresh_enabled: true,
    page_size: 50,
    exchanges: {
      upbit: { enabled: true },
      bithumb: { enabled: true },
      binance: { enabled: true },
    },
  },
  chart: {
    default_exchange: 'upbit',
    default_symbol: 'KRW-BTC',
    default_interval: '60',
    theme: 'light',
    show_volume: true,
    price_format_mode: 'auto',
  },
  ops: {
    market_sync_on_boot: false,
    exchanges: {
      upbit: { auto_start: false, ticker_enabled: true },
      bithumb: { auto_start: false, ticker_enabled: true },
      binance: { auto_start: false, ticker_enabled: true },
    },
  },
}

export function cloneSettingsDocument(settings: ServerSettingsDocument) {
  return structuredClone(settings)
}

export function createEmptyOperationState(): SettingsOperationState {
  return {
    status: 'idle',
    message: null,
  }
}
