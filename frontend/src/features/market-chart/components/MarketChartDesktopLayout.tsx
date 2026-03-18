import { useEffect, useMemo, useState } from 'react'

import {
  type MarketChartSettingsDocument,
  useMarketChartDefaults,
} from '../hooks/useMarketChartDefaults'
import { getDefaultSelectedMarketId, useMarketList } from '../hooks/useMarketList'
import {
  DEFAULT_MARKET_LIST_PAGE_SIZE,
  type MarketChartMarketListItem,
  type MarketListExchange,
  getExchangeDisplayName,
  getSupportedQuotes,
} from '../marketList.types'
import {
  DEFAULT_TRADING_VIEW_SYMBOL,
  TradingViewAdvancedChart,
} from './TradingViewAdvancedChart'
import { MarketChartExchangeSelector } from './MarketChartExchangeSelector'
import { MarketChartMarketListPanel } from './MarketChartMarketListPanel'

type MarketChartAreaProps = {
  label: string
  className: string
}

function MarketChartArea({ label, className }: MarketChartAreaProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-3xl px-6 text-center text-lg font-semibold md:text-xl ${className}`}
    >
      {label}
    </div>
  )
}

function getDefaultTradingViewSymbol(exchange: MarketListExchange) {
  if (exchange === 'bithumb') {
    return 'BITHUMB:BTCKRW'
  }
  if (exchange === 'binance') {
    return 'BINANCE:BTCUSDT'
  }

  return DEFAULT_TRADING_VIEW_SYMBOL
}

function getTradingViewSymbol(
  item: MarketChartMarketListItem | null,
  defaultChartSymbol: string,
  exchange: MarketListExchange,
) {
  return item?.chartSymbol ?? defaultChartSymbol ?? getDefaultTradingViewSymbol(exchange)
}

function getDisplayName(item: MarketChartMarketListItem | null) {
  if (!item) {
    return '대표 마켓'
  }

  return item.displayNameKo ?? item.displayNameEn ?? item.baseAsset
}

function getFallbackPair({
  defaultChartSymbol,
  exchange,
}: {
  defaultChartSymbol: string
  exchange: MarketListExchange
}) {
  const normalizedSymbol = defaultChartSymbol.includes(':')
    ? defaultChartSymbol.split(':', 2)[1] ?? ''
    : defaultChartSymbol
  const supportedQuotes = getSupportedQuotes(exchange)

  for (const quoteAsset of supportedQuotes) {
    if (
      normalizedSymbol.endsWith(quoteAsset) &&
      normalizedSymbol.length > quoteAsset.length
    ) {
      return `${normalizedSymbol.slice(0, -quoteAsset.length)}/${quoteAsset}`
    }
  }

  const fallbackQuote = supportedQuotes[0] ?? 'KRW'

  return `BTC/${fallbackQuote}`
}

function getSelectedMarketSummary({
  item,
  defaultChartSymbol,
  exchange,
}: {
  item: MarketChartMarketListItem | null
  defaultChartSymbol: string
  exchange: MarketListExchange
}) {
  if (!item) {
    return {
      pair: getFallbackPair({ defaultChartSymbol, exchange }),
      tradePrice: '-',
      changeRate: '-',
      volumeText: '-',
    }
  }

  return {
    pair: `${item.baseAsset}/${item.quoteAsset}`,
    tradePrice: item.tradePrice,
    changeRate: item.changeRate,
    volumeText: item.volumeText,
  }
}

export function MarketChartDesktopLayout({
  settings = null,
}: {
  settings?: MarketChartSettingsDocument
}) {
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null)
  const {
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
  } = useMarketChartDefaults(settings)
  const supportedQuotes = useMemo(() => {
    return getSupportedQuotes(activeExchange)
  }, [activeExchange])
  const { items, hasMore, loading, loadingMore, error, loadMore, refetch } =
    useMarketList({
      exchange: activeExchange,
      quote: activeQuote,
      limit: pageSize !== DEFAULT_MARKET_LIST_PAGE_SIZE ? pageSize : undefined,
      orderBy: sortState.orderBy,
      orderDir: sortState.orderDir,
      pollIntervalMs,
      autoRefreshEnabled,
    })
  const selectedMarket = useMemo(() => {
    if (selectedMarketId === null) {
      return null
    }

    return (
      items.find((item) => {
        return item.marketListingId === selectedMarketId
      }) ?? null
    )
  }, [items, selectedMarketId])
  const summary = useMemo(() => {
    return getSelectedMarketSummary({
      item: selectedMarket,
      defaultChartSymbol,
      exchange: activeExchange,
    })
  }, [activeExchange, defaultChartSymbol, selectedMarket])

  useEffect(() => {
    if (items.length === 0) {
      setSelectedMarketId(null)
      return
    }

    const hasSelectedMarket =
      selectedMarketId !== null &&
      items.some((item) => {
        return item.marketListingId === selectedMarketId
      })

    if (hasSelectedMarket) {
      return
    }

    const defaultConfiguredMarket = items.find((item) => {
      return item.chartSymbol === defaultChartSymbol
    })

    if (defaultConfiguredMarket) {
      setSelectedMarketId(defaultConfiguredMarket.marketListingId)
      return
    }

    setSelectedMarketId(getDefaultSelectedMarketId(items))
  }, [defaultChartSymbol, items, selectedMarketId])

  return (
    <div
      data-testid="market-chart-desktop-layout"
      className="flex h-[calc(100vh-3rem)] min-h-0 flex-1 flex-col gap-6"
    >
      <MarketChartArea
        label="상단 영역 - 시세 / 차트"
        className="h-20 bg-slate-300 text-slate-900"
      />

      <div
        data-testid="market-chart-content-grid"
        className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(18rem,28%)] gap-6"
      >
        <div
          data-testid="market-chart-main-column"
          className="flex min-h-0 flex-col gap-6"
        >
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <MarketChartExchangeSelector
                activeExchange={activeExchange}
                exchanges={enabledExchanges}
                isLoading={loading}
                onExchangeChange={(exchange) => {
                  setActiveExchange(exchange)
                  setSelectedMarketId(null)
                }}
              />

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.9fr))] xl:min-w-[32rem]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    선택 마켓
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {getDisplayName(selectedMarket)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {getExchangeDisplayName(activeExchange)} · {summary.pair}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    현재가
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {summary.tradePrice}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    전일대비
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {summary.changeRate}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    거래대금
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {summary.volumeText}
                  </p>
                </div>
              </div>
            </div>
          </section>
          <div className="min-h-0 flex-1">
            <TradingViewAdvancedChart
              symbol={getTradingViewSymbol(
                selectedMarket,
                defaultChartSymbol,
                activeExchange,
              )}
              interval={chartInterval}
              theme={chartTheme}
              showVolume={showVolume}
            />
          </div>
        </div>

        <MarketChartMarketListPanel
          activeQuote={activeQuote}
          supportedQuotes={supportedQuotes}
          selectedMarketId={selectedMarketId}
          items={items}
          hasMore={hasMore}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          orderBy={sortState.orderBy}
          orderDir={sortState.orderDir}
          onQuoteChange={(quote) => {
            setActiveQuote(quote)
            setSelectedMarketId(null)
          }}
          onSortChange={(orderBy, orderDir) => {
            setSortState({ orderBy, orderDir })
          }}
          onSelectMarket={setSelectedMarketId}
          onLoadMore={loadMore}
          onRetry={refetch}
        />
      </div>
    </div>
  )
}
