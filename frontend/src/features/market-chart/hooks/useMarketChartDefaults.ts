import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ALL_MARKET_LIST_EXCHANGES,
  DEFAULT_MARKET_LIST_PAGE_SIZE,
  DEFAULT_MARKET_LIST_SORT,
  getDefaultOrderDir,
  getDefaultQuoteForExchange,
  isQuoteSupported,
  type MarketListExchange,
  type MarketListOrderBy,
  type MarketListOrderDir,
  type MarketListQuote,
  type MarketListSortState,
} from '../marketList.types'

const DEFAULT_EXCHANGE: MarketListExchange = 'upbit'
const DEFAULT_POLL_INTERVAL_MS = 1000
const DEFAULT_CHART_INTERVAL = '60'
const DEFAULT_CHART_THEME = 'light'
const DEFAULT_SHOW_VOLUME = true
const DEFAULT_CHART_SYMBOL = 'UPBIT:BTCKRW'

export type MarketChartTheme = 'light' | 'dark'
type MarketDataExchangeSettings = Partial<
  Record<MarketListExchange, { enabled?: boolean | null }>
>

export type MarketChartSettingsDocument = {
  general?: {
    default_exchange?: MarketListExchange | null
  } | null
  market_data?: {
    default_quote?: MarketListQuote | null
    default_order_by?: MarketListOrderBy | null
    default_order_dir?: MarketListOrderDir | null
    poll_interval_ms?: number | null
    auto_refresh_enabled?: boolean | null
    page_size?: number | null
    exchanges?: MarketDataExchangeSettings | null
  } | null
  chart?: {
    default_exchange?: MarketListExchange | null
    default_symbol?: string | null
    default_interval?: string | null
    theme?: MarketChartTheme | null
    show_volume?: boolean | null
  } | null
} | null

function isExchange(value: unknown): value is MarketListExchange {
  return value === 'upbit' || value === 'bithumb' || value === 'binance'
}

function isQuote(value: unknown): value is MarketListQuote {
  return value === 'KRW' || value === 'BTC' || value === 'USDT'
}

function isOrderBy(value: unknown): value is MarketListOrderBy {
  return (
    value === 'name' ||
    value === 'price' ||
    value === 'change_rate' ||
    value === 'volume_24h' ||
    value === 'trade_amount_24h'
  )
}

function isOrderDir(value: unknown): value is MarketListOrderDir {
  return value === 'asc' || value === 'desc'
}

function normalizePollIntervalMs(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_POLL_INTERVAL_MS
  }

  return Math.max(DEFAULT_POLL_INTERVAL_MS, Math.floor(value))
}

function normalizePageSize(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_MARKET_LIST_PAGE_SIZE
  }

  return Math.min(100, Math.max(20, Math.floor(value)))
}

function normalizeChartInterval(value: unknown) {
  if (typeof value !== 'string') {
    return DEFAULT_CHART_INTERVAL
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : DEFAULT_CHART_INTERVAL
}

function normalizeChartTheme(value: unknown): MarketChartTheme {
  return value === 'dark' ? 'dark' : DEFAULT_CHART_THEME
}

function normalizeShowVolume(value: unknown) {
  return typeof value === 'boolean' ? value : DEFAULT_SHOW_VOLUME
}

function getExchangeDefaultChartSymbol(exchange: MarketListExchange) {
  if (exchange === 'bithumb') {
    return 'BITHUMB:BTCKRW'
  }

  if (exchange === 'binance') {
    return 'BINANCE:BTCUSDT'
  }

  return DEFAULT_CHART_SYMBOL
}

function getEnabledExchanges(exchanges: MarketDataExchangeSettings | null | undefined) {
  const enabledExchanges = ALL_MARKET_LIST_EXCHANGES.filter((exchange) => {
    return exchanges?.[exchange]?.enabled !== false
  })

  return enabledExchanges.length > 0 ? enabledExchanges : [DEFAULT_EXCHANGE]
}

function getSupportedExchange(
  candidate: unknown,
  enabledExchanges: MarketListExchange[],
) {
  if (isExchange(candidate) && enabledExchanges.includes(candidate)) {
    return candidate
  }

  return enabledExchanges[0] ?? DEFAULT_EXCHANGE
}

function normalizeSortState({
  orderBy,
  orderDir,
}: {
  orderBy: unknown
  orderDir: unknown
}): MarketListSortState {
  const normalizedOrderBy = isOrderBy(orderBy)
    ? orderBy
    : DEFAULT_MARKET_LIST_SORT.orderBy
  const defaultOrderDir = getDefaultOrderDir(normalizedOrderBy)

  return {
    orderBy: normalizedOrderBy,
    orderDir: isOrderDir(orderDir) ? orderDir : defaultOrderDir,
  }
}

function normalizeChartSymbol({
  exchange,
  rawSymbol,
}: {
  exchange: MarketListExchange
  rawSymbol: unknown
}) {
  if (typeof rawSymbol !== 'string') {
    return DEFAULT_CHART_SYMBOL
  }

  const trimmed = rawSymbol.trim().toUpperCase()

  if (!trimmed) {
    return DEFAULT_CHART_SYMBOL
  }

  if (trimmed.includes(':')) {
    return trimmed
  }

  const [quoteAsset, baseAsset] = trimmed.split('-', 2)
  const exchangePrefix = exchange.toUpperCase()

  if (quoteAsset && baseAsset) {
    return `${exchangePrefix}:${baseAsset}${quoteAsset}`
  }

  return `${exchangePrefix}:${trimmed}`
}

function resolveInitialState(settings: MarketChartSettingsDocument) {
  const enabledExchanges = getEnabledExchanges(settings?.market_data?.exchanges)
  const activeExchange = getSupportedExchange(
    settings?.general?.default_exchange,
    enabledExchanges,
  )
  const requestedQuote = isQuote(settings?.market_data?.default_quote)
    ? settings.market_data.default_quote
    : getDefaultQuoteForExchange(activeExchange)
  const activeQuote = isQuoteSupported(activeExchange, requestedQuote)
    ? requestedQuote
    : getDefaultQuoteForExchange(activeExchange)
  const sortState = normalizeSortState({
    orderBy: settings?.market_data?.default_order_by,
    orderDir: settings?.market_data?.default_order_dir,
  })
  const pageSize = normalizePageSize(settings?.market_data?.page_size)
  const pollIntervalMs = normalizePollIntervalMs(
    settings?.market_data?.poll_interval_ms,
  )
  const autoRefreshEnabled = settings?.market_data?.auto_refresh_enabled ?? true
  const chartInterval = normalizeChartInterval(settings?.chart?.default_interval)
  const chartTheme = normalizeChartTheme(settings?.chart?.theme)
  const showVolume = normalizeShowVolume(settings?.chart?.show_volume)
  const chartExchange = getSupportedExchange(
    settings?.chart?.default_exchange,
    enabledExchanges,
  )
  const defaultChartSymbol =
    typeof settings?.chart?.default_symbol === 'string' &&
    settings.chart.default_symbol.trim().length > 0
      ? normalizeChartSymbol({
          exchange: chartExchange,
          rawSymbol: settings.chart.default_symbol,
        })
      : getExchangeDefaultChartSymbol(activeExchange)

  return {
    activeExchange,
    activeQuote,
    enabledExchanges,
    sortState,
    pageSize,
    pollIntervalMs,
    autoRefreshEnabled,
    chartInterval,
    chartTheme,
    showVolume,
    defaultChartSymbol,
  }
}

export function useMarketChartDefaults(settings: MarketChartSettingsDocument) {
  const initialState = resolveInitialState(settings)
  const [activeExchange, setActiveExchangeState] = useState<MarketListExchange>(
    initialState.activeExchange,
  )
  const [activeQuote, setActiveQuoteState] = useState<MarketListQuote>(
    initialState.activeQuote,
  )
  const [enabledExchanges, setEnabledExchanges] = useState<MarketListExchange[]>(
    initialState.enabledExchanges,
  )
  const [sortState, setSortStateState] = useState<MarketListSortState>(
    initialState.sortState,
  )
  const [pageSize, setPageSize] = useState(initialState.pageSize)
  const [pollIntervalMs, setPollIntervalMs] = useState(initialState.pollIntervalMs)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(
    initialState.autoRefreshEnabled,
  )
  const [chartInterval, setChartInterval] = useState(initialState.chartInterval)
  const [chartTheme, setChartTheme] = useState<MarketChartTheme>(
    initialState.chartTheme,
  )
  const [showVolume, setShowVolume] = useState(initialState.showVolume)
  const [defaultChartSymbol, setDefaultChartSymbol] = useState(
    initialState.defaultChartSymbol,
  )
  const activeExchangeRef = useRef(activeExchange)
  const hasAppliedSettingsRef = useRef(Boolean(settings))
  const exchangeTouchedRef = useRef(false)
  const quoteTouchedRef = useRef(false)
  const sortTouchedRef = useRef(false)

  useEffect(() => {
    activeExchangeRef.current = activeExchange
  }, [activeExchange])

  const setActiveExchange = useCallback((exchange: MarketListExchange) => {
    if (!enabledExchanges.includes(exchange)) {
      return
    }

    exchangeTouchedRef.current = true
    quoteTouchedRef.current = true

    setActiveExchangeState(exchange)
    setDefaultChartSymbol(getExchangeDefaultChartSymbol(exchange))
    setActiveQuoteState((currentQuote) => {
      if (isQuoteSupported(exchange, currentQuote)) {
        return currentQuote
      }

      return getDefaultQuoteForExchange(exchange)
    })
  }, [enabledExchanges])

  const setActiveQuote = useCallback((quote: MarketListQuote) => {
    quoteTouchedRef.current = true
    setActiveQuoteState(quote)
  }, [])

  const setSortState = useCallback((nextSortState: MarketListSortState) => {
    sortTouchedRef.current = true
    setSortStateState(nextSortState)
  }, [])

  useEffect(() => {
    if (!settings || hasAppliedSettingsRef.current) {
      return
    }

    const nextEnabledExchanges = getEnabledExchanges(settings.market_data?.exchanges)
    const requestedExchange = getSupportedExchange(
      settings.general?.default_exchange,
      nextEnabledExchanges,
    )
    const effectiveExchange = exchangeTouchedRef.current
      ? getSupportedExchange(activeExchangeRef.current, nextEnabledExchanges)
      : requestedExchange

    setEnabledExchanges(nextEnabledExchanges)

    if (
      !exchangeTouchedRef.current ||
      !nextEnabledExchanges.includes(activeExchangeRef.current)
    ) {
      setActiveExchangeState(effectiveExchange)
    }

    const requestedQuote = isQuote(settings.market_data?.default_quote)
      ? settings.market_data.default_quote
      : getDefaultQuoteForExchange(effectiveExchange)
    const effectiveQuote = isQuoteSupported(effectiveExchange, requestedQuote)
      ? requestedQuote
      : getDefaultQuoteForExchange(effectiveExchange)

    if (!quoteTouchedRef.current || !isQuoteSupported(effectiveExchange, activeQuote)) {
      setActiveQuoteState(effectiveQuote)
    }

    if (!sortTouchedRef.current) {
      setSortStateState(
        normalizeSortState({
          orderBy: settings.market_data?.default_order_by,
          orderDir: settings.market_data?.default_order_dir,
        }),
      )
    }

    setPageSize(normalizePageSize(settings.market_data?.page_size))
    setPollIntervalMs(normalizePollIntervalMs(settings.market_data?.poll_interval_ms))
    setAutoRefreshEnabled(
      settings.market_data?.auto_refresh_enabled ?? autoRefreshEnabled,
    )
    setChartInterval(normalizeChartInterval(settings.chart?.default_interval))
    setChartTheme(normalizeChartTheme(settings.chart?.theme))
    setShowVolume(normalizeShowVolume(settings.chart?.show_volume))
    const chartExchange = getSupportedExchange(
      settings.chart?.default_exchange,
      nextEnabledExchanges,
    )
    setDefaultChartSymbol(
      typeof settings.chart?.default_symbol === 'string' &&
        settings.chart.default_symbol.trim().length > 0
        ? normalizeChartSymbol({
            exchange: chartExchange,
            rawSymbol: settings.chart?.default_symbol,
          })
        : getExchangeDefaultChartSymbol(effectiveExchange),
    )

    hasAppliedSettingsRef.current = true
  }, [activeQuote, autoRefreshEnabled, settings])

  return {
    activeExchange,
    activeQuote,
    enabledExchanges,
    sortState,
    pageSize,
    setActiveExchange,
    setActiveQuote,
    setSortState,
    pollIntervalMs,
    autoRefreshEnabled,
    chartInterval,
    chartTheme,
    showVolume,
    defaultChartSymbol,
  }
}
