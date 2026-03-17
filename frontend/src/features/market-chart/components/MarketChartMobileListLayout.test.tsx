import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { MarketChartMobileListLayout } from './MarketChartMobileListLayout'

const { useMarketListMock } = vi.hoisted(() => {
  return {
    useMarketListMock: vi.fn(),
  }
})

vi.mock('../hooks/useMarketList', () => {
  return {
    useMarketList: useMarketListMock,
  }
})

describe('MarketChartMobileListLayout', () => {
  it('모바일 목록에서 실제 데이터와 탭을 렌더링한다', () => {
    useMarketListMock.mockReturnValue({
      items: [
        {
          marketListingId: 1,
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '비트코인',
          tradePrice: '109,131,000',
          changeRate: '-0.84%',
          volumeText: '422,181,000',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<MarketChartMobileListLayout />)

    expect(screen.getByRole('tab', { name: '원화' })).toBeInTheDocument()
    expect(screen.getByText('비트코인')).toBeInTheDocument()
    expect(screen.getByText('BTC/KRW')).toBeInTheDocument()
    expect(screen.getByTestId('market-chart-mobile-list')).toHaveClass(
      'min-h-0',
      'flex-1',
    )
  })
})
