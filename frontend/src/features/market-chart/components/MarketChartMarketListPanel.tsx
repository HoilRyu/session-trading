import type {
  MarketChartMarketListItem,
  MarketListQuote,
} from '../marketList.types'
import { MarketChartMarketListRow } from './MarketChartMarketListRow'

type MarketChartMarketListPanelProps = {
  activeQuote: MarketListQuote
  selectedMarketId: number
  items: MarketChartMarketListItem[]
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
}: MarketChartMarketListPanelProps) {
  return (
    <section className="flex min-h-[24rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
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
        className="flex-1 overflow-y-auto bg-slate-50 px-2 py-2"
      >
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <MarketChartMarketListRow
              key={item.marketListingId}
              item={item}
              isSelected={item.marketListingId === selectedMarketId}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
