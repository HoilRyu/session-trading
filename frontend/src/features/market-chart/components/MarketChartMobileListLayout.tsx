import {
  type MarketChartSettingsDocument,
  useMarketChartDefaults,
} from '../hooks/useMarketChartDefaults'
import { useMarketList } from '../hooks/useMarketList'
import {
  DEFAULT_MARKET_LIST_PAGE_SIZE,
  getSupportedQuotes,
} from '../marketList.types'
import { MarketChartExchangeSelector } from './MarketChartExchangeSelector'
import { MarketChartMarketListPanel } from './MarketChartMarketListPanel'

export function MarketChartMobileListLayout({
  settings = null,
}: {
  settings?: MarketChartSettingsDocument
}) {
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
  } = useMarketChartDefaults(settings)
  const supportedQuotes = getSupportedQuotes(activeExchange)
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

  return (
    <div
      data-testid="market-chart-mobile-list"
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <MarketChartExchangeSelector
          activeExchange={activeExchange}
          exchanges={enabledExchanges}
          isLoading={loading}
          onExchangeChange={(exchange) => {
            setActiveExchange(exchange)
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
