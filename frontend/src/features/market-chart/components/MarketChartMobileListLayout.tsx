import { useState } from 'react'

import { useMarketList } from '../hooks/useMarketList'
import type { MarketListQuote } from '../marketList.types'
import { MarketChartMarketListPanel } from './MarketChartMarketListPanel'

export function MarketChartMobileListLayout() {
  const [activeQuote, setActiveQuote] = useState<MarketListQuote>('KRW')
  const { items, hasMore, loading, loadingMore, error, loadMore, refetch } =
    useMarketList({
    quote: activeQuote,
    })

  return (
    <div
      data-testid="market-chart-mobile-list"
      className="min-h-0 flex-1"
    >
      <MarketChartMarketListPanel
        activeQuote={activeQuote}
        selectedMarketId={null}
        items={items}
        hasMore={hasMore}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        onQuoteChange={setActiveQuote}
        onLoadMore={loadMore}
        onRetry={refetch}
      />
    </div>
  )
}
