import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getMarketsUrl } from '../../../config/backend'
import type { MarketChartMarketListItem, MarketListQuote } from '../marketList.types'
import { mapMarketListResponse } from '../api/marketListMapper'
import type { MarketListApiResponse } from '../api/marketList.types'

const MARKET_LIST_PAGE_SIZE = 50
const MARKET_LIST_REFRESH_INTERVAL_MS = 1000

type UseMarketListOptions = {
  exchange?: string
  quote: MarketListQuote
  limit?: number
}

async function fetchMarketPage({
  exchange,
  quote,
  start,
  limit,
}: {
  exchange: string
  quote: MarketListQuote
  start: number
  limit: number
}) {
  const response = await fetch(getMarketsUrl({ exchange, quote, start, limit }))

  if (!response.ok) {
    throw new Error('request failed')
  }

  return (await response.json()) as MarketListApiResponse
}

function createRefreshStarts(loadedCount: number, pageSize: number) {
  return Array.from({ length: Math.ceil(loadedCount / pageSize) }, (_, index) => {
    return index * pageSize
  })
}

export function getDefaultSelectedMarketId(items: MarketChartMarketListItem[]) {
  const btcKrwItem = items.find((item) => {
    return item.baseAsset === 'BTC' && item.quoteAsset === 'KRW'
  })

  if (btcKrwItem) {
    return btcKrwItem.marketListingId
  }

  return items[0]?.marketListingId ?? null
}

export function useMarketList({
  exchange = 'upbit',
  quote,
  limit = MARKET_LIST_PAGE_SIZE,
}: UseMarketListOptions) {
  const [items, setItems] = useState<MarketChartMarketListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const queryKeyRef = useRef('')

  const queryKey = useMemo(() => {
    return `${exchange}:${quote}:${retryKey}`
  }, [exchange, quote, retryKey])

  const hasMore = items.length < total

  const loadInitialPage = useCallback(async () => {
    queryKeyRef.current = queryKey
    setLoading(true)
    setLoadingMore(false)
    setRefreshing(false)
    setError(null)

    try {
      const payload = await fetchMarketPage({
        exchange,
        quote,
        start: 0,
        limit,
      })

      if (queryKeyRef.current !== queryKey) {
        return
      }

      setItems(mapMarketListResponse(payload))
      setTotal(payload.total)
    } catch {
      if (queryKeyRef.current !== queryKey) {
        return
      }

      setItems([])
      setTotal(0)
      setError('마켓 목록을 불러오지 못했어요.')
    } finally {
      if (queryKeyRef.current !== queryKey) {
        return
      }

      setLoading(false)
    }
  }, [exchange, limit, queryKey, quote])

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || refreshing || !hasMore) {
      return
    }

    const nextStart = items.length

    setLoadingMore(true)
    setError(null)

    try {
      const payload = await fetchMarketPage({
        exchange,
        quote,
        start: nextStart,
        limit,
      })

      if (queryKeyRef.current !== queryKey) {
        return
      }

      setItems((currentItems) => {
        return currentItems.concat(mapMarketListResponse(payload))
      })
      setTotal(payload.total)
    } catch {
      if (queryKeyRef.current !== queryKey) {
        return
      }

      setError('마켓 목록을 불러오지 못했어요.')
    } finally {
      if (queryKeyRef.current !== queryKey) {
        return
      }

      setLoadingMore(false)
    }
  }, [exchange, hasMore, items.length, limit, loading, loadingMore, queryKey, quote, refreshing])

  useEffect(() => {
    void loadInitialPage()
  }, [loadInitialPage])

  useEffect(() => {
    if (loading || loadingMore || items.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (loading || loadingMore || refreshing) {
        return
      }

      const refreshQueryKey = queryKey
      const starts = createRefreshStarts(items.length, limit)

      void (async () => {
        setRefreshing(true)

        try {
          const pages = await Promise.all(
            starts.map((start) =>
              fetchMarketPage({
                exchange,
                quote,
                start,
                limit,
              }),
            ),
          )

          if (queryKeyRef.current !== refreshQueryKey) {
            return
          }

          const nextItems = pages.flatMap((page) => mapMarketListResponse(page))
          const nextTotal = pages[0]?.total ?? 0

          setItems(nextItems)
          setTotal(nextTotal)
          setError(null)
        } catch {
          if (queryKeyRef.current !== refreshQueryKey) {
            return
          }

          setError('마켓 목록을 불러오지 못했어요.')
        } finally {
          if (queryKeyRef.current !== refreshQueryKey) {
            return
          }

          setRefreshing(false)
        }
      })()
    }, MARKET_LIST_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [exchange, items.length, limit, loading, loadingMore, queryKey, quote, refreshing])

  return {
    items,
    total,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadMore,
    refetch: () => setRetryKey((value) => value + 1),
  }
}
