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
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    getDefaultSelectedMarketIdMock.mockReturnValue(999)

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
    expect(
      screen.getAllByTestId('market-list-row').filter((row) => {
        return row.getAttribute('data-selected') === 'true'
      }),
    ).toHaveLength(1)
  })
})
