import { MOCK_MARKET_LIST_ITEMS } from '../mockMarketListItems'
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
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col gap-6">
      <MarketChartArea
        label="상단 영역 - 시세 / 차트"
        className="h-20 bg-slate-300 text-slate-900"
      />

      <div
        data-testid="market-chart-content-grid"
        className="grid min-h-[24rem] flex-1 grid-cols-[minmax(0,1fr)_minmax(18rem,28%)] gap-6"
      >
        <div
          data-testid="market-chart-main-column"
          className="flex min-h-0 flex-col gap-6"
        >
          <MarketChartArea
            label="거래소 선택 + 현재가/요약 정보 영역"
            className="h-28 bg-slate-200 text-slate-900"
          />
          <div className="min-h-[20rem] flex-1">
            <TradingViewAdvancedChart />
          </div>
        </div>

        <MarketChartMarketListPanel
          activeQuote="KRW"
          selectedMarketId={1}
          items={MOCK_MARKET_LIST_ITEMS}
        />
      </div>
    </div>
  )
}
