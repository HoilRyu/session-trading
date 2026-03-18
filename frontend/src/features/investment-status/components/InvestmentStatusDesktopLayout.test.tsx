import { fireEvent, render, screen, within } from '@testing-library/react'

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

  it('전략 카드를 클릭하면 해당 전략 상세를 우측 패널에 보여준다', () => {
    render(<InvestmentStatusDesktopLayout />)
    const detailPanel = screen.getByText('전략 상세').closest('aside') as HTMLElement

    fireEvent.click(screen.getByRole('button', { name: /단기 모멘텀/ }))

    expect(screen.getByRole('button', { name: /단기 모멘텀/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(detailPanel).getByText('단기 모멘텀')).toBeInTheDocument()
    expect(within(detailPanel).getByText('실행 세션 1개')).toBeInTheDocument()
    expect(within(detailPanel).getByText('단기 추세 진입 전략')).toBeInTheDocument()
  })

  it('선택된 전략이 목록에서 사라지면 상세 패널을 빈 상태로 되돌린다', () => {
    const { rerender } = render(<InvestmentStatusDesktopLayout />)
    const detailPanel = screen.getByText('전략 상세').closest('aside') as HTMLElement

    fireEvent.click(screen.getByRole('button', { name: /단기 모멘텀/ }))

    rerender(
      <InvestmentStatusDesktopLayout
        strategies={[
          {
            id: 'strategy-trend',
            label: '추세 추종',
            summary: '실행 세션 2개',
            description: '중기 추세 추종 전략',
          },
          {
            id: 'strategy-dca',
            label: '장기 적립',
            summary: '보유 상태 유지',
            description: '정기 분할 매수 전략',
          },
        ]}
      />,
    )

    expect(
      within(detailPanel).getByText('전략 카드를 선택하면 상세가 표시됩니다'),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('strategy-entry-card')).toHaveLength(2)
    expect(screen.getAllByTestId('strategy-entry-card').every((button) => {
      return button.getAttribute('aria-pressed') !== 'true'
    })).toBe(true)
  })
})
