import type { UIEvent } from 'react'

import type {
  MarketChartMarketListItem,
  MarketListOrderBy,
  MarketListOrderDir,
  MarketListQuote,
} from '../marketList.types'
import { toggleMarketListSort } from '../marketList.types'
import { MarketChartMarketListRow } from './MarketChartMarketListRow'

type MarketChartMarketListPanelProps = {
  activeQuote: MarketListQuote
  supportedQuotes?: MarketListQuote[]
  selectedMarketId: number | null
  items: MarketChartMarketListItem[]
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  error: string | null
  orderBy?: MarketListOrderBy
  orderDir?: MarketListOrderDir
  onQuoteChange: (quote: MarketListQuote) => void
  onSortChange?: (orderBy: MarketListOrderBy, orderDir: MarketListOrderDir) => void
  onSelectMarket?: (marketListingId: number) => void
  onLoadMore: () => void
  onRetry: () => void
}

const QUOTE_TABS: Array<{ value: MarketListQuote; label: string }> = [
  { value: 'KRW', label: '원화' },
  { value: 'BTC', label: 'BTC' },
  { value: 'USDT', label: 'USDT' },
]

const SORT_COLUMNS: Array<{
  value: MarketListOrderBy
  label: string
  align: 'left' | 'right'
}> = [
  { value: 'name', label: '종목명', align: 'left' },
  { value: 'price', label: '현재가', align: 'right' },
  { value: 'change_rate', label: '전일대비', align: 'right' },
  { value: 'trade_amount_24h', label: '거래대금', align: 'right' },
]

export function MarketChartMarketListPanel({
  activeQuote,
  supportedQuotes = QUOTE_TABS.map((tab) => tab.value),
  selectedMarketId,
  items,
  hasMore,
  loading,
  loadingMore,
  error,
  orderBy = 'name',
  orderDir = 'asc',
  onQuoteChange,
  onSortChange = () => {},
  onSelectMarket,
  onLoadMore,
  onRetry,
}: MarketChartMarketListPanelProps) {
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading || loadingMore || error) {
      return
    }

    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget

    if (scrollTop + clientHeight >= scrollHeight - 24) {
      onLoadMore()
    }
  }

  return (
    <section
      data-testid="market-list-panel"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white"
    >
      <div
        role="tablist"
        aria-label="시세 차트 quote 탭"
        className="grid grid-cols-3 border-b border-slate-200"
      >
        {QUOTE_TABS.map((tab) => {
          const isActive = tab.value === activeQuote
          const isSupported = supportedQuotes.includes(tab.value)

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={!isSupported}
              disabled={!isSupported}
              onClick={() => onQuoteChange(tab.value)}
              className={`border-b-2 px-3 py-3 text-sm font-semibold ${
                !isSupported
                  ? 'border-transparent bg-slate-50 text-slate-300'
                  : isActive
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        role="table"
        aria-label="마켓 목록 정렬 헤더"
        className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.78fr)_minmax(0,0.92fr)] gap-2 border-b border-slate-200 px-2 py-2 text-[11px] font-semibold text-slate-400 sm:px-3"
      >
        <div role="row" className="contents">
          {SORT_COLUMNS.map((column) => {
            const isActive = orderBy === column.value
            const nextSort = toggleMarketListSort(
              { orderBy, orderDir },
              column.value,
            )
            const sortIndicator = isActive ? (orderDir === 'asc' ? '▲' : '▼') : '↕'
            const ariaSort = isActive
              ? orderDir === 'asc'
                ? 'ascending'
                : 'descending'
              : 'none'

            return (
              <div
                key={column.value}
                role="columnheader"
                aria-sort={ariaSort}
              >
                <button
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${column.label} 정렬`}
                  onClick={() => onSortChange(nextSort.orderBy, nextSort.orderDir)}
                  className={`flex w-full items-center gap-1 rounded-md px-1 py-1 transition ${
                    column.align === 'right'
                      ? 'justify-end text-right'
                      : 'justify-start text-left'
                  } ${
                    isActive
                      ? 'bg-slate-100 text-slate-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>{column.label}</span>
                  <span aria-hidden="true" className="text-[10px] leading-none">
                    {sortIndicator}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div
        data-testid="market-list-scroll"
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-2 py-2"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center rounded-2xl bg-white text-sm font-medium text-slate-500">
            마켓 목록을 불러오는 중...
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-white px-4 text-center">
            <p className="text-sm font-medium text-slate-600">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl bg-white text-sm font-medium text-slate-500">
            조회 결과가 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {items.map((item) => (
              <MarketChartMarketListRow
                key={item.marketListingId}
                item={item}
                isSelected={
                  selectedMarketId !== null &&
                  item.marketListingId === selectedMarketId
                }
                onSelect={onSelectMarket}
              />
            ))}
            {loadingMore ? (
              <div className="rounded-2xl bg-white px-3 py-3 text-center text-xs font-medium text-slate-500">
                마켓 목록을 더 불러오는 중...
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
