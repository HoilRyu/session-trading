import { render, screen } from '@testing-library/react'

import { TradingViewAdvancedChart } from './TradingViewAdvancedChart'

describe('TradingViewAdvancedChart', () => {
  it('UPBIT:BTCKRW 위젯 스크립트를 주입한다', () => {
    render(<TradingViewAdvancedChart />)

    expect(screen.getByTestId('tradingview-chart-container')).toBeInTheDocument()

    const script = document.querySelector(
      'script[src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"]',
    )

    expect(script).not.toBeNull()
    expect(script?.textContent).toContain('UPBIT:BTCKRW')
    expect(script?.textContent).toContain('"allow_symbol_change":false')
  })
})
