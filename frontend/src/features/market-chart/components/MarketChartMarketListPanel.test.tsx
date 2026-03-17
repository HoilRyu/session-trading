import { render, screen } from '@testing-library/react'

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
  it('탭, 헤더, 리스트 구조를 렌더링한다', () => {
    render(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        selectedMarketId={1}
        items={TEST_ITEMS}
      />,
    )

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
    expect(screen.getByTestId('market-list-scroll')).toHaveClass('overflow-y-auto')
    expect(
      screen.getAllByTestId('market-list-row').filter((row) => {
        return row.getAttribute('data-selected') === 'true'
      }),
    ).toHaveLength(1)
  })
})
