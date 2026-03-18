import { getBackendBaseUrl } from '../../../config/backend'
import type { MarketListExchange } from '../../market-chart/marketList.types'

async function getResponseErrorMessage(response: Response) {
  const payload = await response.json().catch(() => null)

  if (typeof payload?.detail === 'string') {
    return payload.detail
  }

  if (typeof payload?.message === 'string') {
    return payload.message
  }

  return `운영 요청에 실패했어요. (${response.status})`
}

async function post(path: string) {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response))
  }
}

export function triggerMarketSync() {
  return post('/admin/market-syncs')
}

export function startTickerStream(exchange: MarketListExchange) {
  return post(`/admin/market-data-streams/ticker/start?exchange=${exchange}`)
}

export function stopTickerStream(exchange: MarketListExchange) {
  return post(`/admin/market-data-streams/ticker/stop?exchange=${exchange}`)
}
