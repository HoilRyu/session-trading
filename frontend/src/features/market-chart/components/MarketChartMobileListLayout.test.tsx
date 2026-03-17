import { render, screen } from '@testing-library/react'

import { MarketChartMobileListLayout } from './MarketChartMobileListLayout'

describe('MarketChartMobileListLayout', () => {
  it('모바일 마켓 목록 영역을 렌더링한다', () => {
    render(<MarketChartMobileListLayout />)

    expect(screen.getByText('마켓 목록 영역')).toBeInTheDocument()
    expect(screen.getByTestId('market-chart-mobile-list')).toHaveClass(
      'min-h-0',
      'flex-1',
    )
  })
})
