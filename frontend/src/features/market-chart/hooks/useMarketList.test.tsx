import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

import type { MarketListQuote } from '../marketList.types'
import { getDefaultSelectedMarketId, useMarketList } from './useMarketList'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useMarketList', () => {
  it('KRW 목록을 조회한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        start: 0,
        limit: 50,
        total: 1,
        refreshed_at: '2026-03-17T12:00:00Z',
        items: [
          {
            market_listing_id: 1,
            exchange: 'upbit',
            raw_symbol: 'KRW-BTC',
            base_asset: 'BTC',
            quote_asset: 'KRW',
            display_name_ko: '비트코인',
            display_name_en: 'Bitcoin',
            has_warning: false,
            trade_price: '109131000.00000000',
            signed_change_rate: '-0.0084',
            acc_trade_volume_24h: '422181000.00000000',
            event_time: null,
          },
        ],
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useMarketList({ quote: 'KRW' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/markets?exchange=upbit&quote=KRW&limit=50',
    )
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]?.tradePrice).toBe('109,131,000')
    expect(result.current.error).toBeNull()
  })

  it('요청 실패를 에러 상태로 노출한다', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useMarketList({ quote: 'BTC' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items).toHaveLength(0)
    expect(result.current.error).toBe('마켓 목록을 불러오지 못했어요.')
  })

  it('quote가 바뀌면 다시 조회한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          start: 0,
          limit: 50,
          total: 0,
          refreshed_at: '2026-03-17T12:00:00Z',
          items: [],
        }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          start: 0,
          limit: 50,
          total: 0,
          refreshed_at: '2026-03-17T12:00:01Z',
          items: [],
        }),
      })

    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = renderHook(
      ({ quote }: { quote: MarketListQuote }) => useMarketList({ quote }),
      { initialProps: { quote: 'KRW' as MarketListQuote } },
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    rerender({ quote: 'USDT' as MarketListQuote })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/api/v1/markets?exchange=upbit&quote=USDT&limit=50',
    )
  })
})

describe('getDefaultSelectedMarketId', () => {
  it('BTC/KRW를 우선 선택하고 없으면 첫 항목을 선택한다', () => {
    expect(
      getDefaultSelectedMarketId([
        {
          marketListingId: 2,
          baseAsset: 'ETH',
          quoteAsset: 'KRW',
          displayNameKo: '이더리움',
          tradePrice: '3,426,000',
          changeRate: '-1.01%',
          volumeText: '351,296,000',
        },
        {
          marketListingId: 1,
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '비트코인',
          tradePrice: '109,131,000',
          changeRate: '-0.84%',
          volumeText: '422,181,000',
        },
      ]),
    ).toBe(1)

    expect(
      getDefaultSelectedMarketId([
        {
          marketListingId: 3,
          baseAsset: 'SOL',
          quoteAsset: 'USDT',
          displayNameEn: 'Solana',
          tradePrice: '138.4',
          changeRate: '-2.19%',
          volumeText: '121,383,000',
        },
      ]),
    ).toBe(3)

    expect(getDefaultSelectedMarketId([])).toBeNull()
  })
})
