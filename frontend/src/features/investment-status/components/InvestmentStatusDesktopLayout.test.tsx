import { render, screen } from '@testing-library/react'

import { InvestmentStatusDesktopLayout } from './InvestmentStatusDesktopLayout'

describe('InvestmentStatusDesktopLayout', () => {
  it('투자현황 데스크톱 3영역 골격을 렌더링한다', () => {
    render(<InvestmentStatusDesktopLayout />)

    expect(screen.getByTestId('investment-status-desktop-layout')).toBeInTheDocument()
    expect(screen.getByText('현재 실행 중 작업')).toBeInTheDocument()
    expect(screen.getAllByTestId('running-job-card')).toHaveLength(3)
    expect(screen.getByText('투자 방식')).toBeInTheDocument()
    expect(screen.getAllByTestId('strategy-entry-card')).toHaveLength(3)
    expect(
      screen.getByText('전략 카드를 선택하면 상세가 표시됩니다'),
    ).toBeInTheDocument()
  })
})
