import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { MarketChartExchangeSelector } from './MarketChartExchangeSelector'

describe('MarketChartExchangeSelector', () => {
  it('거래소 세그먼트와 로딩 배지를 렌더링한다', () => {
    render(
      <MarketChartExchangeSelector
        activeExchange="upbit"
        isLoading
        onExchangeChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('tab', { name: '업비트' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: '빗썸' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(screen.getByRole('tab', { name: '바이낸스' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(screen.getByText('연결 중...')).toBeInTheDocument()
  })

  it('다른 거래소를 누르면 변경 콜백을 호출한다', () => {
    const handleExchangeChange = vi.fn()

    render(
      <MarketChartExchangeSelector
        activeExchange="upbit"
        onExchangeChange={handleExchangeChange}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: '바이낸스' }))

    expect(handleExchangeChange).toHaveBeenCalledWith('binance')
  })

  it('활성화된 거래소만 렌더링한다', () => {
    render(
      <MarketChartExchangeSelector
        activeExchange="binance"
        exchanges={['binance']}
        onExchangeChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('tab', { name: '바이낸스' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '업비트' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '빗썸' })).not.toBeInTheDocument()
  })
})
