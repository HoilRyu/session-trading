import { fireEvent, render, screen } from '@testing-library/react'

import type { MarketChartMarketListItem } from '../marketList.types'
import { MarketChartMarketListPanel } from './MarketChartMarketListPanel'

const TEST_ITEMS: MarketChartMarketListItem[] = [
  {
    marketListingId: 1,
    baseAsset: 'BTC',
    quoteAsset: 'KRW',
    displayNameKo: '비트코인',
    displayNameEn: 'Bitcoin',
    tradePrice: '109,131,000',
    changeRate: '-0.84%',
    volumeText: '422,181백만',
  },
  {
    marketListingId: 2,
    baseAsset: 'ETH',
    quoteAsset: 'KRW',
    displayNameKo: '이더리움',
    displayNameEn: 'Ethereum',
    tradePrice: '3,426,000',
    changeRate: '-1.01%',
    volumeText: '351,296백만',
  },
]

describe('MarketChartMarketListPanel', () => {
  it('탭 전환과 리스트 구조를 렌더링한다', () => {
    const handleQuoteChange = vi.fn()
    const handleLoadMore = vi.fn()

    render(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore
        loading={false}
        loadingMore={false}
        error={null}
        onQuoteChange={handleQuoteChange}
        onLoadMore={handleLoadMore}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByTestId('market-list-panel')).toHaveClass('h-full', 'min-h-0')
    expect(screen.getByRole('tab', { name: '원화' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'BTC' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'USDT' })).toBeInTheDocument()
    expect(screen.getByText('종목명')).toBeInTheDocument()
    expect(screen.getByText('현재가')).toBeInTheDocument()
    expect(screen.getByText('전일대비')).toBeInTheDocument()
    expect(screen.getByText('거래대금')).toBeInTheDocument()
    expect(screen.getByText('비트코인')).toBeInTheDocument()
    expect(screen.getByText('BTC/KRW')).toBeInTheDocument()
    expect(screen.getAllByTestId('market-list-row')).toHaveLength(2)
    expect(screen.getByTestId('market-list-scroll')).toHaveClass(
      'min-h-0',
      'overflow-y-auto',
    )
    expect(
      screen.getAllByTestId('market-list-row').filter((row) => {
        return row.getAttribute('data-selected') === 'true'
      }),
    ).toHaveLength(1)

    fireEvent.click(screen.getByRole('tab', { name: 'BTC' }))

    expect(handleQuoteChange).toHaveBeenCalledWith('BTC')

    const scrollContainer = screen.getByTestId('market-list-scroll')

    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      value: 180,
    })
    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: 120,
    })
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      configurable: true,
      value: 320,
    })

    fireEvent.scroll(scrollContainer)

    expect(handleLoadMore).toHaveBeenCalledTimes(1)
  })

  it('로딩과 에러 상태를 렌더링한다', () => {
    const handleRetry = vi.fn()

    const { rerender } = render(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        selectedMarketId={null}
        items={[]}
        hasMore
        loading
        loadingMore={false}
        error={null}
        onQuoteChange={vi.fn()}
        onLoadMore={vi.fn()}
        onRetry={handleRetry}
      />,
    )

    expect(screen.getByText('마켓 목록을 불러오는 중...')).toBeInTheDocument()

    rerender(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        selectedMarketId={null}
        items={[]}
        hasMore
        loading={false}
        loadingMore={false}
        error="마켓 목록을 불러오지 못했어요."
        onQuoteChange={vi.fn()}
        onLoadMore={vi.fn()}
        onRetry={handleRetry}
      />,
    )

    expect(screen.getByText('마켓 목록을 불러오지 못했어요.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('추가 로딩 중에는 하단 로딩 문구를 보여주고 더 이상 없으면 호출하지 않는다', () => {
    const handleLoadMore = vi.fn()

    const { rerender } = render(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore
        loading={false}
        loadingMore
        error={null}
        onQuoteChange={vi.fn()}
        onLoadMore={handleLoadMore}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('마켓 목록을 더 불러오는 중...')).toBeInTheDocument()

    rerender(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore={false}
        loading={false}
        loadingMore={false}
        error={null}
        onQuoteChange={vi.fn()}
        onLoadMore={handleLoadMore}
        onRetry={vi.fn()}
      />,
    )

    const scrollContainer = screen.getByTestId('market-list-scroll')

    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      value: 180,
    })
    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: 120,
    })
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      configurable: true,
      value: 320,
    })

    fireEvent.scroll(scrollContainer)

    expect(handleLoadMore).not.toHaveBeenCalled()
  })
})
