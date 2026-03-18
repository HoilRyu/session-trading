import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { MarketChartDesktopLayout } from './MarketChartDesktopLayout'

const { useMarketListMock, getDefaultSelectedMarketIdMock } = vi.hoisted(() => {
  return {
    useMarketListMock: vi.fn(),
    getDefaultSelectedMarketIdMock: vi.fn(),
  }
})

vi.mock('../hooks/useMarketList', () => {
  return {
    useMarketList: useMarketListMock,
    getDefaultSelectedMarketId: getDefaultSelectedMarketIdMock,
  }
})

describe('MarketChartDesktopLayout', () => {
  it('차트 중심 데스크톱 영역을 렌더링한다', () => {
    const loadMoreMock = vi.fn()

    useMarketListMock.mockReturnValue({
      items: [
        {
          marketListingId: 999,
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '실데이터 비트코인',
          tradePrice: '110,000,000',
          changeRate: '+1.00%',
          volumeText: '100,000,000',
        },
      ],
      total: 120,
      hasMore: true,
      loading: false,
      loadingMore: true,
      refreshing: false,
      error: null,
      loadMore: loadMoreMock,
      refetch: vi.fn(),
    })
    getDefaultSelectedMarketIdMock.mockReturnValue(999)

    render(<MarketChartDesktopLayout />)

    expect(screen.getByTestId('market-chart-desktop-layout')).toHaveClass(
      'h-[calc(100vh-3rem)]',
      'min-h-0',
    )
    expect(screen.getByTestId('market-chart-content-grid')).toHaveClass(
      'grid',
      'min-h-0',
      'grid-cols-[minmax(0,1fr)_minmax(18rem,28%)]',
    )
    expect(screen.getByTestId('market-chart-main-column')).toHaveClass(
      'flex',
      'flex-col',
      'min-h-0',
    )
    expect(screen.getByText('상단 영역 - 시세 / 차트')).toBeInTheDocument()
    expect(
      screen.getByText('거래소 선택 + 현재가/요약 정보 영역'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('tradingview-chart-container')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '원화' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'BTC' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'USDT' })).toBeInTheDocument()
    expect(screen.getByText('종목명')).toBeInTheDocument()
    expect(screen.getByText('현재가')).toBeInTheDocument()
    expect(screen.getByText('전일대비')).toBeInTheDocument()
    expect(screen.getByText('거래대금')).toBeInTheDocument()
    expect(screen.getByText('실데이터 비트코인')).toBeInTheDocument()
    expect(screen.getByText('BTC/KRW')).toBeInTheDocument()
    expect(screen.getByText('마켓 목록을 더 불러오는 중...')).toBeInTheDocument()
    expect(
      screen.getAllByTestId('market-list-row').filter((row) => {
        return row.getAttribute('data-selected') === 'true'
      }),
    ).toHaveLength(1)
  })
})
