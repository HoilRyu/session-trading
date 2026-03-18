import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

import type { MarketListQuote } from '../marketList.types'
import { getDefaultSelectedMarketId, useMarketList } from './useMarketList'

type MarketListApiItem = {
  market_listing_id: number
  exchange: string
  raw_symbol: string
  base_asset: string
  quote_asset: string
  display_name_ko: string | null
  display_name_en: string | null
  has_warning: boolean
  trade_price: string | null
  signed_change_rate: string | null
  acc_trade_volume_24h: string | null
  event_time: string | null
}

function createMarketItem(index: number, quote: string): MarketListApiItem {
  const baseAsset = `COIN${index}`

  return {
    market_listing_id: index,
    exchange: 'upbit',
    raw_symbol: `${quote}-${baseAsset}`,
    base_asset: baseAsset,
    quote_asset: quote,
    display_name_ko: `코인 ${index}`,
    display_name_en: `Coin ${index}`,
    has_warning: false,
    trade_price: `${1000 + index}.00000000`,
    signed_change_rate: '0.0100',
    acc_trade_volume_24h: `${50000 + index}.00000000`,
    event_time: null,
  }
}

function createMarketListResponse({
  start,
  limit = 50,
  total,
  quote,
  count,
}: {
  start: number
  limit?: number
  total: number
  quote: string
  count: number
}) {
  return {
    start,
    limit,
    total,
    refreshed_at: '2026-03-18T00:00:00Z',
    items: Array.from({ length: count }, (_, offset) =>
      createMarketItem(start + offset + 1, quote),
    ),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useMarketList', () => {
  it('초기 목록을 start=0, limit=50으로 조회한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () =>
        createMarketListResponse({
          start: 0,
          total: 120,
          quote: 'KRW',
          count: 50,
        }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useMarketList({ quote: 'KRW' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/markets?exchange=upbit&quote=KRW&start=0&limit=50',
    )
    expect(result.current.items).toHaveLength(50)
    expect(result.current.total).toBe(120)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('loadMore가 다음 start=50 범위를 이어붙인다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMarketListResponse({
            start: 0,
            total: 75,
            quote: 'KRW',
            count: 50,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createMarketListResponse({
            start: 50,
            total: 75,
            quote: 'KRW',
            count: 25,
          }),
      })

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useMarketList({ quote: 'KRW' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.loadMore()
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/api/v1/markets?exchange=upbit&quote=KRW&start=50&limit=50',
    )
    expect(result.current.items).toHaveLength(75)
    expect(result.current.hasMore).toBe(false)
  })

  it('1초마다 현재 로드한 전체 범위를 50 단위로 재조회한다', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: string) => {
      const url = new URL(input)
      const start = Number(url.searchParams.get('start') ?? '0')

      if (start === 0) {
        return {
          ok: true,
          json: async () =>
            createMarketListResponse({
              start: 0,
              total: 120,
              quote: 'KRW',
              count: 50,
            }),
        }
      }

      return {
        ok: true,
        json: async () =>
          createMarketListResponse({
            start: 50,
            total: 120,
            quote: 'KRW',
            count: 50,
          }),
      }
    })

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useMarketList({ quote: 'KRW' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.loadMore()
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4), {
      timeout: 2000,
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://127.0.0.1:8000/api/v1/markets?exchange=upbit&quote=KRW&start=0&limit=50',
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'http://127.0.0.1:8000/api/v1/markets?exchange=upbit&quote=KRW&start=50&limit=50',
    )
  })

  it('quote가 바뀌면 목록과 범위가 start=0부터 다시 초기화된다', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: string) => {
      if (input.includes('quote=KRW')) {
        return {
          ok: true,
          json: async () =>
            createMarketListResponse({
              start: 0,
              total: 120,
              quote: 'KRW',
              count: 50,
            }),
        }
      }

      return {
        ok: true,
        json: async () =>
          createMarketListResponse({
            start: 0,
            total: 30,
            quote: 'USDT',
            count: 30,
          }),
      }
    })

    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      ({ quote }: { quote: MarketListQuote }) => useMarketList({ quote }),
      { initialProps: { quote: 'KRW' as MarketListQuote } },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.loadMore()
    })

    rerender({ quote: 'USDT' as MarketListQuote })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/api/v1/markets?exchange=upbit&quote=USDT&start=0&limit=50',
    )
    expect(result.current.items).toHaveLength(30)
    expect(result.current.total).toBe(30)
    expect(result.current.hasMore).toBe(false)
  })

  it('요청 실패를 에러 상태로 노출한다', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useMarketList({ quote: 'BTC' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items).toHaveLength(0)
    expect(result.current.error).toBe('마켓 목록을 불러오지 못했어요.')
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
