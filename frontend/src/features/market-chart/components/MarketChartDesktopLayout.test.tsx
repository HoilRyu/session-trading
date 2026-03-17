import { render, screen } from '@testing-library/react'

import { MarketChartDesktopLayout } from './MarketChartDesktopLayout'

describe('MarketChartDesktopLayout', () => {
  it('차트 중심 데스크톱 영역을 렌더링한다', () => {
    render(<MarketChartDesktopLayout />)

    expect(screen.getByTestId('market-chart-content-grid')).toHaveClass(
      'grid',
      'grid-cols-[minmax(0,1fr)_minmax(18rem,28%)]',
    )
    expect(screen.getByTestId('market-chart-main-column')).toHaveClass(
      'flex',
      'flex-col',
    )
    expect(screen.getByText('상단 영역 - 시세 / 차트')).toBeInTheDocument()
    expect(
      screen.getByText('거래소 선택 + 현재가/요약 정보 영역'),
    ).toBeInTheDocument()
    expect(screen.getByText('차트 영역')).toBeInTheDocument()
    expect(screen.getByText('마켓 목록 영역')).toBeInTheDocument()
  })
})
