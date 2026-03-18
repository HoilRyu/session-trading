import { useEffect, useRef } from 'react'

const TRADING_VIEW_WIDGET_SRC =
  'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'

export const DEFAULT_TRADING_VIEW_SYMBOL = 'UPBIT:BTCKRW'
const DEFAULT_TRADING_VIEW_INTERVAL = '60'
const DEFAULT_TRADING_VIEW_THEME = 'light'

function createTradingViewConfig({
  symbol,
  interval,
  theme,
  showVolume,
}: {
  symbol: string
  interval: string
  theme: 'light' | 'dark'
  showVolume: boolean
}) {
  return {
    autosize: true,
    symbol,
    interval,
    theme,
    style: '1',
    locale: 'kr',
    allow_symbol_change: false,
    calendar: false,
    hide_volume: !showVolume,
  }
}

type TradingViewAdvancedChartProps = {
  symbol: string
  interval?: string
  theme?: 'light' | 'dark'
  showVolume?: boolean
}

export function TradingViewAdvancedChart({
  symbol = DEFAULT_TRADING_VIEW_SYMBOL,
  interval = DEFAULT_TRADING_VIEW_INTERVAL,
  theme = DEFAULT_TRADING_VIEW_THEME,
  showVolume = true,
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
    script.text = JSON.stringify(
      createTradingViewConfig({ symbol, interval, theme, showVolume }),
    )

    container.append(widgetRoot, script)

    return () => {
      container.innerHTML = ''
    }
  }, [interval, showVolume, symbol, theme])

  return (
    <div
      data-testid="tradingview-chart-container"
      className="h-full min-h-[20rem] overflow-hidden rounded-3xl bg-white"
    >
      <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
    </div>
  )
}
