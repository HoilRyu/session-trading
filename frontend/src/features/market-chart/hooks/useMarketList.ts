import { useEffect, useState } from 'react'

import { getMarketsUrl } from '../../../config/backend'
import type { MarketChartMarketListItem, MarketListQuote } from '../marketList.types'
import { mapMarketListResponse } from '../api/marketListMapper'
import type { MarketListApiResponse } from '../api/marketList.types'

type UseMarketListOptions = {
  exchange?: string
  quote: MarketListQuote
  limit?: number
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
  limit = 50,
}: UseMarketListOptions) {
  const [items, setItems] = useState<MarketChartMarketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    const loadMarketList = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(getMarketsUrl({ exchange, quote, limit }))

        if (!response.ok) {
          throw new Error('request failed')
        }

        const payload = (await response.json()) as MarketListApiResponse

        if (!isMounted) {
          return
        }

        setItems(mapMarketListResponse(payload))
      } catch {
        if (!isMounted) {
          return
        }

        setItems([])
        setError('마켓 목록을 불러오지 못했어요.')
      } finally {
        if (!isMounted) {
          return
        }

        setLoading(false)
      }
    }

    void loadMarketList()

    return () => {
      isMounted = false
    }
  }, [exchange, quote, limit, retryKey])

  return {
    items,
    loading,
    error,
    refetch: () => setRetryKey((value) => value + 1),
  }
}
