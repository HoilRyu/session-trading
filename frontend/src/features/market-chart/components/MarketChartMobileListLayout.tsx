import { useState } from 'react'

import { useMarketList } from '../hooks/useMarketList'
import type { MarketListQuote } from '../marketList.types'
import { MarketChartMarketListPanel } from './MarketChartMarketListPanel'

export function MarketChartMobileListLayout() {
  const [activeQuote, setActiveQuote] = useState<MarketListQuote>('KRW')
  const { items, loading, error, refetch } = useMarketList({
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
        loading={loading}
        error={error}
        onQuoteChange={setActiveQuote}
        onRetry={refetch}
      />
    </div>
  )
}
