import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { MarketChartDesktopLayout } from './MarketChartDesktopLayout'

const { useMarketListMock, getDefaultSelectedMarketIdMock, tradingViewChartMock } =
  vi.hoisted(() => {
    return {
      useMarketListMock: vi.fn(),
      getDefaultSelectedMarketIdMock: vi.fn(),
      tradingViewChartMock: vi.fn(),
    }
  })

vi.mock('../hooks/useMarketList', () => {
  return {
    useMarketList: useMarketListMock,
    getDefaultSelectedMarketId: getDefaultSelectedMarketIdMock,
  }
})

vi.mock('./TradingViewAdvancedChart', () => {
  return {
    DEFAULT_TRADING_VIEW_SYMBOL: 'UPBIT:BTCKRW',
    TradingViewAdvancedChart: tradingViewChartMock,
  }
})

describe('MarketChartDesktopLayout', () => {
  it('차트 중심 데스크톱 영역을 렌더링한다', () => {
    const loadMoreMock = vi.fn()

    useMarketListMock.mockReturnValue({
      items: [
        {
          marketListingId: 999,
          chartSymbol: 'UPBIT:BTCKRW',
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
    tradingViewChartMock.mockImplementation(({ symbol }: { symbol: string }) => {
      return <div data-testid="tradingview-chart-container">{symbol}</div>
    })

    render(<MarketChartDesktopLayout />)

    expect(useMarketListMock).toHaveBeenCalledWith({
      exchange: 'upbit',
      quote: 'KRW',
      orderBy: 'name',
      orderDir: 'asc',
    })

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
    expect(screen.getByRole('tab', { name: '업비트' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: '빗썸' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '바이낸스' })).toBeInTheDocument()
    expect(screen.getByText('선택 마켓')).toBeInTheDocument()
    expect(screen.getByText('업비트 · BTC/KRW')).toBeInTheDocument()
    expect(screen.getByTestId('tradingview-chart-container')).toBeInTheDocument()
    expect(screen.getByText('UPBIT:BTCKRW')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '원화' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'BTC' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'USDT' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /종목명 정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /현재가 정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /전일대비 정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /거래대금 정렬/ })).toBeInTheDocument()
    expect(screen.getAllByText('실데이터 비트코인')).toHaveLength(2)
    expect(screen.getByText('BTC/KRW')).toBeInTheDocument()
    expect(screen.getByText('마켓 목록을 더 불러오는 중...')).toBeInTheDocument()
    expect(
      screen.getAllByTestId('market-list-row').filter((row) => {
        return row.getAttribute('data-selected') === 'true'
      }),
    ).toHaveLength(1)
  })

  it('헤더 클릭으로 서버 정렬 컬럼과 방향을 토글한다', async () => {
    useMarketListMock.mockReturnValue({
      items: [
        {
          marketListingId: 999,
          chartSymbol: 'UPBIT:BTCKRW',
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
      loadingMore: false,
      refreshing: false,
      error: null,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    })
    getDefaultSelectedMarketIdMock.mockReturnValue(999)
    tradingViewChartMock.mockImplementation(({ symbol }: { symbol: string }) => {
      return <div data-testid="tradingview-chart-container">{symbol}</div>
    })

    render(<MarketChartDesktopLayout />)

    fireEvent.click(screen.getByRole('button', { name: /현재가 정렬/ }))

    await waitFor(() => {
      expect(useMarketListMock).toHaveBeenLastCalledWith({
        exchange: 'upbit',
        quote: 'KRW',
        orderBy: 'price',
        orderDir: 'desc',
      })
    })

    fireEvent.click(screen.getByRole('button', { name: /현재가 정렬/ }))

    await waitFor(() => {
      expect(useMarketListMock).toHaveBeenLastCalledWith({
        exchange: 'upbit',
        quote: 'KRW',
        orderBy: 'price',
        orderDir: 'asc',
      })
    })
  })

  it('행을 클릭하면 차트 심볼을 해당 마켓으로 바꾼다', async () => {
    useMarketListMock.mockReturnValue({
      items: [
        {
          marketListingId: 999,
          chartSymbol: 'UPBIT:BTCKRW',
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '실데이터 비트코인',
          tradePrice: '110,000,000',
          changeRate: '+1.00%',
          volumeText: '100,000,000',
        },
        {
          marketListingId: 1001,
          chartSymbol: 'UPBIT:XRPBTC',
          baseAsset: 'XRP',
          quoteAsset: 'BTC',
          displayNameKo: '리플',
          tradePrice: '0.00000136',
          changeRate: '+2.11%',
          volumeText: '52.93',
        },
      ],
      total: 120,
      hasMore: true,
      loading: false,
      loadingMore: false,
      refreshing: false,
      error: null,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    })
    getDefaultSelectedMarketIdMock.mockReturnValue(999)
    tradingViewChartMock.mockImplementation(({ symbol }: { symbol: string }) => {
      return <div data-testid="tradingview-chart-container">{symbol}</div>
    })

    render(<MarketChartDesktopLayout />)

    expect(screen.getByText('UPBIT:BTCKRW')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '리플 BTC/XRP 차트 보기' }))

    await waitFor(() => {
      expect(screen.getByText('UPBIT:XRPBTC')).toBeInTheDocument()
    })
  })

  it('거래소를 빗썸으로 바꾸면 목록 조회와 차트 기본 심볼을 함께 전환한다', async () => {
    useMarketListMock.mockImplementation(
      ({
        exchange,
      }: {
        exchange: 'upbit' | 'bithumb' | 'binance'
        quote: 'KRW' | 'BTC' | 'USDT'
        orderBy: string
        orderDir: string
      }) => {
        const items =
          exchange === 'bithumb'
            ? [
                {
                  marketListingId: 2001,
                  chartSymbol: 'BITHUMB:BTCKRW',
                  baseAsset: 'BTC',
                  quoteAsset: 'KRW',
                  displayNameKo: '비트코인',
                  tradePrice: '109,900,000',
                  changeRate: '+0.51%',
                  volumeText: '92,000,000',
                },
              ]
            : [
                {
                  marketListingId: 999,
                  chartSymbol: 'UPBIT:BTCKRW',
                  baseAsset: 'BTC',
                  quoteAsset: 'KRW',
                  displayNameKo: '비트코인',
                  tradePrice: '110,000,000',
                  changeRate: '+1.00%',
                  volumeText: '100,000,000',
                },
              ]

        return {
          items,
          total: items.length,
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
    getDefaultSelectedMarketIdMock.mockReturnValue(999)
    tradingViewChartMock.mockImplementation(({ symbol }: { symbol: string }) => {
      return <div data-testid="tradingview-chart-container">{symbol}</div>
    })

    render(<MarketChartDesktopLayout />)

    fireEvent.click(screen.getByRole('tab', { name: '빗썸' }))

    await waitFor(() => {
      expect(useMarketListMock).toHaveBeenLastCalledWith({
        exchange: 'bithumb',
        quote: 'KRW',
        orderBy: 'name',
        orderDir: 'asc',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('BITHUMB:BTCKRW')).toBeInTheDocument()
    })
    expect(screen.getByText('빗썸 · BTC/KRW')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'USDT' })).toBeDisabled()
  })

  it('거래소를 바이낸스로 바꾸면 USDT 목록과 기본 차트 심볼로 전환한다', async () => {
    useMarketListMock.mockImplementation(
      ({
        exchange,
      }: {
        exchange: 'upbit' | 'bithumb' | 'binance'
        quote: 'KRW' | 'BTC' | 'USDT'
        orderBy: string
        orderDir: string
      }) => {
        if (exchange === 'binance') {
          return {
            items: [
              {
                marketListingId: 3001,
                chartSymbol: 'BINANCE:BTCUSDT',
                baseAsset: 'BTC',
                quoteAsset: 'USDT',
                displayNameEn: 'Bitcoin',
                tradePrice: '74,057.4',
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
        }

        return {
          items: [
            {
              marketListingId: 999,
              chartSymbol: 'UPBIT:BTCKRW',
              baseAsset: 'BTC',
              quoteAsset: 'KRW',
              displayNameKo: '비트코인',
              tradePrice: '110,000,000',
              changeRate: '+1.00%',
              volumeText: '100,000,000',
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
    getDefaultSelectedMarketIdMock.mockImplementation((items) => {
      return items[0]?.marketListingId ?? null
    })
    tradingViewChartMock.mockImplementation(({ symbol }: { symbol: string }) => {
      return <div data-testid="tradingview-chart-container">{symbol}</div>
    })

    render(<MarketChartDesktopLayout />)

    fireEvent.click(screen.getByRole('tab', { name: '바이낸스' }))

    await waitFor(() => {
      expect(useMarketListMock).toHaveBeenLastCalledWith({
        exchange: 'binance',
        quote: 'USDT',
        orderBy: 'name',
        orderDir: 'asc',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('BINANCE:BTCUSDT')).toBeInTheDocument()
    })
    expect(screen.getByText('바이낸스 · BTC/USDT')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '원화' })).toBeDisabled()
    expect(screen.getByRole('tab', { name: 'USDT' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('목록이 다시 들어와도 선택한 마켓 차트를 유지한다', async () => {
    const initialItems = [
      {
        marketListingId: 999,
        chartSymbol: 'UPBIT:BTCKRW',
        baseAsset: 'BTC',
        quoteAsset: 'KRW',
        displayNameKo: '실데이터 비트코인',
        tradePrice: '110,000,000',
        changeRate: '+1.00%',
        volumeText: '100,000,000',
      },
      {
        marketListingId: 1001,
        chartSymbol: 'UPBIT:XRPBTC',
        baseAsset: 'XRP',
        quoteAsset: 'BTC',
        displayNameKo: '리플',
        tradePrice: '0.00000136',
        changeRate: '+2.11%',
        volumeText: '52.93',
      },
    ]
    let currentItems = initialItems

    useMarketListMock.mockImplementation(() => {
      return {
        items: currentItems,
        total: 120,
        hasMore: true,
        loading: false,
        loadingMore: false,
        refreshing: false,
        error: null,
        loadMore: vi.fn(),
        refetch: vi.fn(),
      }
    })
    getDefaultSelectedMarketIdMock.mockReturnValue(999)
    tradingViewChartMock.mockImplementation(({ symbol }: { symbol: string }) => {
      return <div data-testid="tradingview-chart-container">{symbol}</div>
    })

    const { rerender } = render(<MarketChartDesktopLayout />)

    fireEvent.click(screen.getByRole('button', { name: '리플 BTC/XRP 차트 보기' }))

    await waitFor(() => {
      expect(screen.getByText('UPBIT:XRPBTC')).toBeInTheDocument()
    })

    currentItems = [...initialItems].reverse()
    rerender(<MarketChartDesktopLayout />)

    await waitFor(() => {
      expect(screen.getByText('UPBIT:XRPBTC')).toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: '리플 BTC/XRP 차트 보기' }),
    ).toHaveAttribute('data-selected', 'true')
  })

  it('업비트 USDT 탭에서 빗썸으로 바꾸면 지원 가능한 KRW 탭으로 자동 복귀한다', async () => {
    useMarketListMock.mockReturnValue({
      items: [
        {
          marketListingId: 999,
          chartSymbol: 'UPBIT:BTCKRW',
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '실데이터 비트코인',
          tradePrice: '110,000,000',
          changeRate: '+1.00%',
          volumeText: '100,000,000',
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
    getDefaultSelectedMarketIdMock.mockReturnValue(999)
    tradingViewChartMock.mockImplementation(({ symbol }: { symbol: string }) => {
      return <div data-testid="tradingview-chart-container">{symbol}</div>
    })

    render(<MarketChartDesktopLayout />)

    fireEvent.click(screen.getByRole('tab', { name: 'USDT' }))

    await waitFor(() => {
      expect(useMarketListMock).toHaveBeenLastCalledWith({
        exchange: 'upbit',
        quote: 'USDT',
        orderBy: 'name',
        orderDir: 'asc',
      })
    })

    fireEvent.click(screen.getByRole('tab', { name: '빗썸' }))

    await waitFor(() => {
      expect(useMarketListMock).toHaveBeenLastCalledWith({
        exchange: 'bithumb',
        quote: 'KRW',
        orderBy: 'name',
        orderDir: 'asc',
      })
    })
    expect(screen.getByRole('tab', { name: '원화' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
