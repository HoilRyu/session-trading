import { useEffect, useRef } from 'react'

const TRADING_VIEW_WIDGET_SRC =
  'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'

export const DEFAULT_TRADING_VIEW_SYMBOL = 'UPBIT:BTCKRW'

function createTradingViewConfig(symbol: string) {
  return {
    autosize: true,
    symbol,
    interval: '60',
    theme: 'light',
    style: '1',
    locale: 'kr',
    allow_symbol_change: false,
    calendar: false,
  }
}

type TradingViewAdvancedChartProps = {
  symbol: string
}

export function TradingViewAdvancedChart({
  symbol = DEFAULT_TRADING_VIEW_SYMBOL,
}: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    container.innerHTML = ''

    const widgetRoot = document.createElement('div')
    widgetRoot.className = 'tradingview-widget-container__widget h-full w-full'

    const script = document.createElement('script')
    script.src = TRADING_VIEW_WIDGET_SRC
    script.type = 'text/javascript'
    script.async = true
    script.text = JSON.stringify(createTradingViewConfig(symbol))

    container.append(widgetRoot, script)

    return () => {
      container.innerHTML = ''
    }
  }, [symbol])

  return (
    <div
      data-testid="tradingview-chart-container"
      className="h-full min-h-[20rem] overflow-hidden rounded-3xl bg-white"
    >
      <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
    </div>
  )
}
