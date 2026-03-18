import { useState } from 'react'

import { getDefaultSelectedMarketId, useMarketList } from '../hooks/useMarketList'
import type { MarketListQuote } from '../marketList.types'
import { TradingViewAdvancedChart } from './TradingViewAdvancedChart'
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

export function MarketChartDesktopLayout() {
  const [activeQuote, setActiveQuote] = useState<MarketListQuote>('KRW')
  const { items, hasMore, loading, loadingMore, error, loadMore, refetch } =
    useMarketList({
    quote: activeQuote,
    })
  const selectedMarketId = getDefaultSelectedMarketId(items)

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
          <MarketChartArea
            label="거래소 선택 + 현재가/요약 정보 영역"
            className="h-28 bg-slate-200 text-slate-900"
          />
          <div className="min-h-0 flex-1">
            <TradingViewAdvancedChart />
          </div>
        </div>

        <MarketChartMarketListPanel
          activeQuote={activeQuote}
          selectedMarketId={selectedMarketId}
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
    </div>
  )
}
