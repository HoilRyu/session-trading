import {
  getExchangeDisplayName,
  type MarketListExchange,
} from '../marketList.types'

type MarketChartExchangeSelectorProps = {
  activeExchange: MarketListExchange
  isLoading?: boolean
  onExchangeChange: (exchange: MarketListExchange) => void
}

const EXCHANGES: MarketListExchange[] = ['upbit', 'bithumb', 'binance']

export function MarketChartExchangeSelector({
  activeExchange,
  isLoading = false,
  onExchangeChange,
}: MarketChartExchangeSelectorProps) {
  return (
    <div
      data-testid="market-chart-exchange-selector"
      className="flex flex-wrap items-center gap-3"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          거래소
        </p>
        <p className="mt-1 text-xs text-slate-500">
          차트와 마켓 목록에 동시에 적용돼요
        </p>
      </div>

      <div
        role="tablist"
        aria-label="거래소 선택"
        className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1"
      >
        {EXCHANGES.map((exchange) => {
          const isActive = exchange === activeExchange
          return (
            <button
              key={exchange}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onExchangeChange(exchange)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {getExchangeDisplayName(exchange)}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          연결 중...
        </span>
      ) : null}
    </div>
  )
}
