import type { MarketListQueryParams } from '../features/market-chart/api/marketList.types'

const DEFAULT_BACKEND_HOST = '127.0.0.1'
const DEFAULT_BACKEND_PORT = '8000'
const DEFAULT_BACKEND_USE_HTTPS = false

function getBackendHost() {
  return import.meta.env.VITE_BACKEND_HOST || DEFAULT_BACKEND_HOST
}

function getBackendPort() {
  return import.meta.env.VITE_BACKEND_PORT || DEFAULT_BACKEND_PORT
}

function getBackendUseHttps() {
  return import.meta.env.VITE_BACKEND_USE_HTTPS === 'true'
    ? true
    : DEFAULT_BACKEND_USE_HTTPS
}

function getHttpProtocol() {
  return getBackendUseHttps() ? 'https' : 'http'
}

function getWsProtocol() {
  return getBackendUseHttps() ? 'wss' : 'ws'
}

export function getBackendTargetLabel() {
  return `${getBackendHost()}:${getBackendPort()}`
}

export function getBackendBaseUrl() {
  return `${getHttpProtocol()}://${getBackendTargetLabel()}`
}

export function getBackendHealthUrl() {
  return `${getBackendBaseUrl()}/health`
}

export function getBackendWsBaseUrl() {
  return `${getWsProtocol()}://${getBackendTargetLabel()}`
}

export function getMarketsUrl({
  exchange = 'upbit',
  quote = 'KRW',
  limit = 50,
}: MarketListQueryParams = {}) {
  const params = new URLSearchParams({
    exchange,
    quote,
    limit: String(limit),
  })

  return `${getBackendBaseUrl()}/api/v1/markets?${params.toString()}`
}
