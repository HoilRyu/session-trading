import { render, screen } from '@testing-library/react'

import { DashboardDesktopLayout } from './DashboardDesktopLayout'

describe('DashboardDesktopLayout', () => {
  it('카드 위계가 드러나는 데스크톱 와이어프레임 레이아웃을 렌더링한다', () => {
    render(<DashboardDesktopLayout />)

    expect(screen.getByTestId('dashboard-desktop-layout')).toHaveClass(
      'flex',
      'flex-col',
      'flex-1',
      'gap-6',
    )
    expect(screen.getByTestId('dashboard-desktop-layout')).not.toHaveClass(
      'h-[calc(100vh-3rem)]',
    )
    expect(screen.getByTestId('dashboard-main-grid')).toHaveClass(
      'grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]',
    )

    expect(screen.getAllByTestId('dashboard-card-label')).toHaveLength(13)
    expect(screen.getAllByTestId('dashboard-card-body')).toHaveLength(13)
    expect(screen.getAllByTestId('dashboard-card-footer')).toHaveLength(13)

    expect(screen.getByText('Dashboard Header')).toBeInTheDocument()
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

    expect(screen.getByTestId('dashboard-card-summary-01')).toHaveClass('min-h-[7rem]')
    expect(screen.getByTestId('dashboard-card-summary-04')).toHaveClass('min-h-[7rem]')
    expect(screen.getByTestId('dashboard-card-primary')).toHaveClass('min-h-[16rem]')
    expect(screen.getByTestId('dashboard-card-side-a')).toHaveClass('min-h-[7.5rem]')
    expect(screen.getByTestId('dashboard-card-side-b')).toHaveClass('min-h-[7.5rem]')
    expect(screen.getByTestId('dashboard-card-compare-a')).toHaveClass('min-h-[9.5rem]')
    expect(screen.getByTestId('dashboard-card-compare-c')).toHaveClass('min-h-[9.5rem]')
    expect(screen.getByTestId('dashboard-card-wide-a')).toHaveClass('min-h-[9rem]')
    expect(screen.getByTestId('dashboard-card-wide-b')).toHaveClass('min-h-[9rem]')
  })
})
