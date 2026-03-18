import { useState } from 'react'

import { useMarketList } from '../hooks/useMarketList'
import {
  DEFAULT_MARKET_LIST_SORT,
  type MarketListExchange,
  type MarketListQuote,
  getDefaultQuoteForExchange,
  getSupportedQuotes,
  isQuoteSupported,
} from '../marketList.types'
import { MarketChartExchangeSelector } from './MarketChartExchangeSelector'
import { MarketChartMarketListPanel } from './MarketChartMarketListPanel'

export function MarketChartMobileListLayout() {
  const [activeExchange, setActiveExchange] = useState<MarketListExchange>('upbit')
  const [activeQuote, setActiveQuote] = useState<MarketListQuote>('KRW')
  const [sortState, setSortState] = useState(DEFAULT_MARKET_LIST_SORT)
  const supportedQuotes = getSupportedQuotes(activeExchange)
  const { items, hasMore, loading, loadingMore, error, loadMore, refetch } =
    useMarketList({
      exchange: activeExchange,
      quote: activeQuote,
      orderBy: sortState.orderBy,
      orderDir: sortState.orderDir,
    })

  return (
    <div
      data-testid="market-chart-mobile-list"
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <MarketChartExchangeSelector
          activeExchange={activeExchange}
          isLoading={loading}
          onExchangeChange={(exchange) => {
            setActiveExchange(exchange)

            if (!isQuoteSupported(exchange, activeQuote)) {
              setActiveQuote(getDefaultQuoteForExchange(exchange))
            }
          }}
        />
      </section>

      <MarketChartMarketListPanel
        activeQuote={activeQuote}
        supportedQuotes={supportedQuotes}
        selectedMarketId={null}
        items={items}
        hasMore={hasMore}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        orderBy={sortState.orderBy}
        orderDir={sortState.orderDir}
        onQuoteChange={setActiveQuote}
        onSortChange={(orderBy, orderDir) => {
          setSortState({ orderBy, orderDir })
        }}
        onLoadMore={loadMore}
        onRetry={refetch}
      />
    </div>
  )
}
