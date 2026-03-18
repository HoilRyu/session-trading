import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import type { MarketChartMarketListItem } from '../marketList.types'
import { MarketChartMarketListPanel } from './MarketChartMarketListPanel'

const TEST_ITEMS: MarketChartMarketListItem[] = [
  {
    marketListingId: 1,
    chartSymbol: 'UPBIT:BTCKRW',
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
    chartSymbol: 'UPBIT:ETHKRW',
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
    const handleSortChange = vi.fn()

    render(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        supportedQuotes={['KRW', 'BTC', 'USDT']}
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore
        loading={false}
        loadingMore={false}
        error={null}
        orderBy="name"
        orderDir="asc"
        onQuoteChange={handleQuoteChange}
        onSortChange={handleSortChange}
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
    expect(screen.getByRole('button', { name: /종목명 정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /현재가 정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /전일대비 정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /거래대금 정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /종목명/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
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
    fireEvent.click(screen.getByRole('button', { name: /현재가 정렬/ }))

    expect(handleQuoteChange).toHaveBeenCalledWith('BTC')
    expect(handleSortChange).toHaveBeenCalledWith('price', 'desc')

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
        supportedQuotes={['KRW', 'BTC', 'USDT']}
        selectedMarketId={null}
        items={[]}
        hasMore
        loading
        loadingMore={false}
        error={null}
        orderBy="name"
        orderDir="asc"
        onQuoteChange={vi.fn()}
        onSortChange={vi.fn()}
        onLoadMore={vi.fn()}
        onRetry={handleRetry}
      />,
    )

    expect(screen.getByText('마켓 목록을 불러오는 중...')).toBeInTheDocument()

    rerender(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        supportedQuotes={['KRW', 'BTC', 'USDT']}
        selectedMarketId={null}
        items={[]}
        hasMore
        loading={false}
        loadingMore={false}
        error="마켓 목록을 불러오지 못했어요."
        orderBy="name"
        orderDir="asc"
        onQuoteChange={vi.fn()}
        onSortChange={vi.fn()}
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
        supportedQuotes={['KRW', 'BTC', 'USDT']}
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore
        loading={false}
        loadingMore
        error={null}
        orderBy="name"
        orderDir="asc"
        onQuoteChange={vi.fn()}
        onSortChange={vi.fn()}
        onLoadMore={handleLoadMore}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('마켓 목록을 더 불러오는 중...')).toBeInTheDocument()

    rerender(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        supportedQuotes={['KRW', 'BTC', 'USDT']}
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore={false}
        loading={false}
        loadingMore={false}
        error={null}
        orderBy="name"
        orderDir="asc"
        onQuoteChange={vi.fn()}
        onSortChange={vi.fn()}
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

  it('같은 컬럼을 다시 누르면 정렬 방향을 반대로 바꾼다', () => {
    const handleSortChange = vi.fn()

    render(
      <MarketChartMarketListPanel
        activeQuote="BTC"
        supportedQuotes={['KRW', 'BTC', 'USDT']}
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore={false}
        loading={false}
        loadingMore={false}
        error={null}
        orderBy="price"
        orderDir="desc"
        onQuoteChange={vi.fn()}
        onSortChange={handleSortChange}
        onLoadMore={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /현재가 정렬/ }))

    expect(handleSortChange).toHaveBeenCalledWith('price', 'asc')
    expect(screen.getByRole('columnheader', { name: /현재가/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('행 클릭 시 선택 콜백으로 marketListingId를 전달한다', () => {
    const handleSelectMarket = vi.fn()

    render(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        supportedQuotes={['KRW', 'BTC', 'USDT']}
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore={false}
        loading={false}
        loadingMore={false}
        error={null}
        orderBy="name"
        orderDir="asc"
        onQuoteChange={vi.fn()}
        onSortChange={vi.fn()}
        onSelectMarket={handleSelectMarket}
        onLoadMore={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '이더리움 KRW/ETH 차트 보기' }))

    expect(handleSelectMarket).toHaveBeenCalledWith(2)
  })

  it('지원하지 않는 quote는 비활성화한다', () => {
    const handleQuoteChange = vi.fn()

    render(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        supportedQuotes={['KRW', 'BTC']}
        selectedMarketId={1}
        items={TEST_ITEMS}
        hasMore={false}
        loading={false}
        loadingMore={false}
        error={null}
        orderBy="name"
        orderDir="asc"
        onQuoteChange={handleQuoteChange}
        onSortChange={vi.fn()}
        onLoadMore={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'USDT' }))

    expect(screen.getByRole('tab', { name: 'USDT' })).toBeDisabled()
    expect(screen.getByRole('tab', { name: 'BTC' })).not.toBeDisabled()
    expect(handleQuoteChange).not.toHaveBeenCalled()
  })
})
