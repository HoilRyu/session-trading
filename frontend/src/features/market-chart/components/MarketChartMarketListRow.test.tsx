import { fireEvent, render, screen } from '@testing-library/react'

import { MarketChartMarketListRow } from './MarketChartMarketListRow'

describe('MarketChartMarketListRow', () => {
  it('한글 종목명과 심볼 줄을 렌더링한다', () => {
    render(
      <MarketChartMarketListRow
        item={{
          marketListingId: 1,
          chartSymbol: 'UPBIT:BTCKRW',
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '비트코인',
          displayNameEn: 'Bitcoin',
          tradePrice: '109,131,000',
          changeRate: '-0.84%',
          volumeText: '422,181백만',
        }}
        isSelected
      />,
    )

    expect(screen.getByText('비트코인')).toBeInTheDocument()
    expect(screen.getByText('BTC/KRW')).toBeInTheDocument()
    expect(screen.getByText('109,131,000')).toBeInTheDocument()
    expect(screen.getByText('-0.84%')).toBeInTheDocument()
    expect(screen.getByText('422,181백만')).toBeInTheDocument()
    expect(screen.getByTestId('market-list-row')).toHaveAttribute(
      'data-selected',
      'true',
    )
  })

  it('영문명과 base asset fallback을 사용한다', () => {
    const { rerender } = render(
      <MarketChartMarketListRow
        item={{
          marketListingId: 2,
          chartSymbol: 'BINANCE:ETHUSDT',
          baseAsset: 'ETH',
          quoteAsset: 'USDT',
          displayNameEn: 'Ethereum',
          tradePrice: '3,426.00',
          changeRate: '-1.01%',
          volumeText: '351,296백만',
        }}
        isSelected={false}
      />,
    )

    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument()
    expect(screen.getByTestId('market-list-row')).toHaveAttribute(
      'data-selected',
      'false',
    )

    rerender(
      <MarketChartMarketListRow
        item={{
          marketListingId: 3,
          chartSymbol: 'UPBIT:SOLBTC',
          baseAsset: 'SOL',
          quoteAsset: 'BTC',
          tradePrice: '0.00234',
          changeRate: '+2.11%',
          volumeText: '52,930백만',
        }}
        isSelected={false}
      />,
    )

    expect(screen.getByText('SOL')).toBeInTheDocument()
    expect(screen.getByText('SOL/BTC')).toBeInTheDocument()
  })

  it('선택 콜백이 있으면 행 클릭으로 해당 종목을 전달한다', () => {
    const handleSelect = vi.fn()

    render(
      <MarketChartMarketListRow
        item={{
          marketListingId: 4,
          chartSymbol: 'UPBIT:XRPBTC',
          baseAsset: 'XRP',
          quoteAsset: 'BTC',
          displayNameKo: '리플',
          tradePrice: '0.00000136',
          changeRate: '+2.11%',
          volumeText: '52.93',
        }}
        isSelected={false}
        onSelect={handleSelect}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '리플 BTC/XRP 차트 보기' }))

    expect(handleSelect).toHaveBeenCalledWith(4)
  })
})
