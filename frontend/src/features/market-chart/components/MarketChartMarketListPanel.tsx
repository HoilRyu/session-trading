import type {
  MarketChartMarketListItem,
  MarketListQuote,
} from '../marketList.types'
import { MarketChartMarketListRow } from './MarketChartMarketListRow'

type MarketChartMarketListPanelProps = {
  activeQuote: MarketListQuote
  selectedMarketId: number | null
  items: MarketChartMarketListItem[]
  loading: boolean
  error: string | null
  onQuoteChange: (quote: MarketListQuote) => void
  onRetry: () => void
}

const QUOTE_TABS: Array<{ value: MarketListQuote; label: string }> = [
  { value: 'KRW', label: '원화' },
  { value: 'BTC', label: 'BTC' },
  { value: 'USDT', label: 'USDT' },
]

export function MarketChartMarketListPanel({
  activeQuote,
  selectedMarketId,
  items,
  loading,
  error,
  onQuoteChange,
  onRetry,
}: MarketChartMarketListPanelProps) {
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

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onQuoteChange(tab.value)}
              className={`border-b-2 px-3 py-3 text-sm font-semibold ${
                isActive
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,0.75fr)_minmax(0,0.95fr)] gap-3 border-b border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-400">
        <p>종목명</p>
        <p className="text-right">현재가</p>
        <p className="text-right">전일대비</p>
        <p className="text-right">거래대금</p>
      </div>

      <div
        data-testid="market-list-scroll"
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
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
