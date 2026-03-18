import { render, screen } from '@testing-library/react'

import { TradingViewAdvancedChart } from './TradingViewAdvancedChart'

describe('TradingViewAdvancedChart', () => {
  it('UPBIT:BTCKRW 위젯 스크립트를 주입한다', () => {
    render(<TradingViewAdvancedChart symbol="UPBIT:BTCKRW" />)

    expect(screen.getByTestId('tradingview-chart-container')).toBeInTheDocument()

    const script = document.querySelector(
      'script[src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"]',
    )

    expect(script).not.toBeNull()
    expect(script?.textContent).toContain('UPBIT:BTCKRW')
    expect(script?.textContent).toContain('"allow_symbol_change":false')
  })

  it('symbol prop이 바뀌면 새 심볼로 위젯 스크립트를 다시 주입한다', () => {
    const { rerender } = render(<TradingViewAdvancedChart symbol="UPBIT:BTCKRW" />)

    rerender(<TradingViewAdvancedChart symbol="UPBIT:XRPBTC" />)

    const script = document.querySelector(
      'script[src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"]',
    )

    expect(script?.textContent).toContain('UPBIT:XRPBTC')
  })

  it('interval, theme, showVolume props를 위젯 설정에 반영한다', () => {
    render(
      <TradingViewAdvancedChart
        symbol="BINANCE:BTCUSDT"
        interval="240"
        theme="dark"
        showVolume={false}
      />,
    )

    const script = document.querySelector(
      'script[src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"]',
    )

    expect(script?.textContent).toContain('"interval":"240"')
    expect(script?.textContent).toContain('"theme":"dark"')
    expect(script?.textContent).toContain('"hide_volume":true')
  })
})
