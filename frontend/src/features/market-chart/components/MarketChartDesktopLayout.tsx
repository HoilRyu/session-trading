import { useEffect, useMemo, useState } from 'react'

import { getDefaultSelectedMarketId, useMarketList } from '../hooks/useMarketList'
import {
  DEFAULT_MARKET_LIST_SORT,
  type MarketChartMarketListItem,
  type MarketListExchange,
  type MarketListQuote,
  getDefaultQuoteForExchange,
  getExchangeDisplayName,
  getSupportedQuotes,
  isQuoteSupported,
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
  exchange: MarketListExchange,
) {
  return item?.chartSymbol ?? getDefaultTradingViewSymbol(exchange)
}

function getDisplayName(item: MarketChartMarketListItem | null) {
  if (!item) {
    return '대표 마켓'
  }

  return item.displayNameKo ?? item.displayNameEn ?? item.baseAsset
}

function getSelectedMarketSummary(item: MarketChartMarketListItem | null) {
  if (!item) {
    return {
      pair: 'BTC/KRW',
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

export function MarketChartDesktopLayout() {
  const [activeExchange, setActiveExchange] = useState<MarketListExchange>('upbit')
  const [activeQuote, setActiveQuote] = useState<MarketListQuote>('KRW')
  const [sortState, setSortState] = useState(DEFAULT_MARKET_LIST_SORT)
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null)
  const supportedQuotes = useMemo(() => {
    return getSupportedQuotes(activeExchange)
  }, [activeExchange])
  const { items, hasMore, loading, loadingMore, error, loadMore, refetch } =
    useMarketList({
      exchange: activeExchange,
      quote: activeQuote,
      orderBy: sortState.orderBy,
      orderDir: sortState.orderDir,
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
    return getSelectedMarketSummary(selectedMarket)
  }, [selectedMarket])

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

    setSelectedMarketId(getDefaultSelectedMarketId(items))
  }, [items, selectedMarketId])

  useEffect(() => {
    if (isQuoteSupported(activeExchange, activeQuote)) {
      return
    }

    setActiveQuote(getDefaultQuoteForExchange(activeExchange))
  }, [activeExchange, activeQuote])

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
                isLoading={loading}
                onExchangeChange={(exchange) => {
                  setActiveExchange(exchange)
                  setSelectedMarketId(null)

                  if (!isQuoteSupported(exchange, activeQuote)) {
                    setActiveQuote(getDefaultQuoteForExchange(exchange))
                  }
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
              symbol={getTradingViewSymbol(selectedMarket, activeExchange)}
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
