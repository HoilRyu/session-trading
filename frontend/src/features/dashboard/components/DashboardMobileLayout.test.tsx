import { render, screen } from '@testing-library/react'

import { DashboardMobileLayout } from './DashboardMobileLayout'

describe('DashboardMobileLayout', () => {
  it('모바일 카드 흐름과 내부 스크롤 정책을 렌더링한다', () => {
    render(<DashboardMobileLayout />)

    expect(screen.getByTestId('dashboard-mobile-layout')).toHaveClass(
      'min-h-0',
      'flex',
      'flex-1',
      'flex-col',
      'overflow-y-auto',
    )
    expect(screen.getByTestId('dashboard-mobile-summary-grid')).toHaveClass(
      'grid',
      'grid-cols-2',
    )
    expect(screen.getByTestId('dashboard-mobile-side-stack')).toHaveClass('grid')
    expect(screen.getByTestId('dashboard-mobile-compare-grid')).toHaveClass(
      'grid',
      'grid-cols-2',
    )
    expect(screen.getByTestId('dashboard-mobile-wide-stack')).toHaveClass('grid')

    expect(screen.getAllByTestId('dashboard-card-label')).toHaveLength(12)
    expect(screen.getAllByTestId('dashboard-card-body')).toHaveLength(12)
    expect(screen.getAllByTestId('dashboard-card-footer')).toHaveLength(12)

    expect(screen.getByText('Summary 01')).toBeInTheDocument()
    expect(screen.getByText('Summary 02')).toBeInTheDocument()
    expect(screen.getByText('Summary 03')).toBeInTheDocument()
    expect(screen.getByText('Summary 04')).toBeInTheDocument()
    expect(screen.getByText('Primary Panel')).toBeInTheDocument()
    expect(screen.getByText('Side Panel A')).toBeInTheDocument()
    expect(screen.getByText('Side Panel B')).toBeInTheDocument()
    expect(screen.getByText('Compare A')).toBeInTheDocument()
    expect(screen.getByText('Compare B')).toBeInTheDocument()
    expect(screen.getByText('Compare C')).toBeInTheDocument()
    expect(screen.getByText('Wide Panel A')).toBeInTheDocument()
    expect(screen.getByText('Wide Panel B')).toBeInTheDocument()

    expect(screen.getByTestId('dashboard-card-summary-01')).toHaveClass(
      'min-h-[5.5rem]',
    )
    expect(screen.getByTestId('dashboard-card-summary-04')).toHaveClass(
      'min-h-[5.5rem]',
    )
    expect(screen.getByTestId('dashboard-card-primary')).toHaveClass('min-h-[11rem]')
    expect(screen.getByTestId('dashboard-card-side-a')).toHaveClass('min-h-[6.5rem]')
    expect(screen.getByTestId('dashboard-card-side-b')).toHaveClass('min-h-[6.5rem]')
    expect(screen.getByTestId('dashboard-card-compare-a')).toHaveClass(
      'min-h-[6rem]',
    )
    expect(screen.getByTestId('dashboard-card-compare-b')).toHaveClass(
      'min-h-[6rem]',
    )
    expect(screen.getByTestId('dashboard-card-compare-c')).toHaveClass(
      'min-h-[6rem]',
    )
    expect(screen.getByTestId('dashboard-card-wide-a')).toHaveClass('min-h-[6.5rem]')
    expect(screen.getByTestId('dashboard-card-wide-b')).toHaveClass('min-h-[6.5rem]')
  })
})
