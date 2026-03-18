import { fireEvent, render, screen } from '@testing-library/react'
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
    const loadMoreMock = vi.fn()

    useMarketListMock.mockReturnValue({
      items: [
        {
          marketListingId: 1,
          chartSymbol: 'UPBIT:BTCKRW',
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '비트코인',
          tradePrice: '109,131,000',
          changeRate: '-0.84%',
          volumeText: '422,181,000',
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

    render(<MarketChartMobileListLayout />)

    expect(useMarketListMock).toHaveBeenCalledWith({
      exchange: 'upbit',
      quote: 'KRW',
      orderBy: 'name',
      orderDir: 'asc',
    })

    expect(screen.getByRole('tab', { name: '업비트' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: '빗썸' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '바이낸스' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '원화' })).toBeInTheDocument()
    expect(screen.getByText('비트코인')).toBeInTheDocument()
    expect(screen.getByText('BTC/KRW')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /현재가 정렬/ })).toBeInTheDocument()
    expect(screen.getByText('마켓 목록을 더 불러오는 중...')).toBeInTheDocument()
    expect(screen.getByTestId('market-chart-mobile-list')).toHaveClass(
      'min-h-0',
      'flex-1',
    )
  })

  it('빗썸으로 바꾸면 빗썸 목록을 조회하고 USDT 탭을 비활성화한다', () => {
    useMarketListMock.mockImplementation(
      ({
        exchange,
      }: {
        exchange: 'upbit' | 'bithumb' | 'binance'
        quote: 'KRW' | 'BTC' | 'USDT'
        orderBy: string
        orderDir: string
      }) => {
        return {
          items: [
            {
              marketListingId: exchange === 'bithumb' ? 2 : 1,
              chartSymbol: exchange === 'bithumb' ? 'BITHUMB:BTCKRW' : 'UPBIT:BTCKRW',
              baseAsset: 'BTC',
              quoteAsset: 'KRW',
              displayNameKo: '비트코인',
              tradePrice: '109,131,000',
              changeRate: '-0.84%',
              volumeText: '422,181,000',
            },
          ],
          total: 1,
          hasMore: false,
          loading: false,
          loadingMore: false,
          refreshing: false,
          error: null,
          loadMore: vi.fn(),
          refetch: vi.fn(),
        }
      },
    )

    render(<MarketChartMobileListLayout />)

    fireEvent.click(screen.getByRole('tab', { name: '빗썸' }))

    expect(useMarketListMock).toHaveBeenLastCalledWith({
      exchange: 'bithumb',
      quote: 'KRW',
      orderBy: 'name',
      orderDir: 'asc',
    })
    expect(screen.getByRole('tab', { name: 'USDT' })).toBeDisabled()
  })

  it('업비트 USDT 탭에서 빗썸으로 바꾸면 KRW 탭으로 자동 복귀한다', () => {
    useMarketListMock.mockReturnValue({
      items: [
        {
          marketListingId: 1,
          chartSymbol: 'UPBIT:BTCKRW',
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '비트코인',
          tradePrice: '109,131,000',
          changeRate: '-0.84%',
          volumeText: '422,181,000',
        },
      ],
      total: 1,
      hasMore: false,
      loading: false,
      loadingMore: false,
      refreshing: false,
      error: null,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    })

    render(<MarketChartMobileListLayout />)

    fireEvent.click(screen.getByRole('tab', { name: 'USDT' }))
    expect(useMarketListMock).toHaveBeenLastCalledWith({
      exchange: 'upbit',
      quote: 'USDT',
      orderBy: 'name',
      orderDir: 'asc',
    })

    fireEvent.click(screen.getByRole('tab', { name: '빗썸' }))

    expect(useMarketListMock).toHaveBeenLastCalledWith({
      exchange: 'bithumb',
      quote: 'KRW',
      orderBy: 'name',
      orderDir: 'asc',
    })
  })

  it('바이낸스로 바꾸면 USDT 탭으로 자동 복귀하고 KRW 탭을 비활성화한다', () => {
    useMarketListMock.mockImplementation(
      ({
        exchange,
        quote,
      }: {
        exchange: 'upbit' | 'bithumb' | 'binance'
        quote: 'KRW' | 'BTC' | 'USDT'
        orderBy: string
        orderDir: string
      }) => {
        return {
          items: [
            {
              marketListingId: exchange === 'binance' ? 3 : 1,
              chartSymbol:
                exchange === 'binance' ? 'BINANCE:BTCUSDT' : 'UPBIT:BTCKRW',
              baseAsset: 'BTC',
              quoteAsset: quote,
              displayNameEn: 'Bitcoin',
              tradePrice: exchange === 'binance' ? '74,057.4' : '109,131,000',
              changeRate: '+0.18%',
              volumeText: '1,306,763,722.01',
            },
          ],
          total: 1,
          hasMore: false,
          loading: false,
          loadingMore: false,
          refreshing: false,
          error: null,
          loadMore: vi.fn(),
          refetch: vi.fn(),
        }
      },
    )

    render(<MarketChartMobileListLayout />)

    fireEvent.click(screen.getByRole('tab', { name: '바이낸스' }))

    expect(useMarketListMock).toHaveBeenLastCalledWith({
      exchange: 'binance',
      quote: 'USDT',
      orderBy: 'name',
      orderDir: 'asc',
    })
    expect(screen.getByRole('tab', { name: '원화' })).toBeDisabled()
    expect(screen.getByRole('tab', { name: 'USDT' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
