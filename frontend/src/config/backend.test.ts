import { afterEach, vi } from 'vitest'

import {
  getBackendBaseUrl,
  getBackendHealthUrl,
  getBackendTargetLabel,
  getBackendWsBaseUrl,
  getMarketsUrl,
} from './backend'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('backend config', () => {
  it('uses local defaults when env vars are missing', () => {
    expect(getBackendBaseUrl()).toBe('http://127.0.0.1:8000')
    expect(getBackendHealthUrl()).toBe('http://127.0.0.1:8000/health')
    expect(getBackendWsBaseUrl()).toBe('ws://127.0.0.1:8000')
    expect(getBackendTargetLabel()).toBe('127.0.0.1:8000')
  })

  it('builds secure backend urls from env vars', () => {
    vi.stubEnv('VITE_BACKEND_HOST', 'api.example.com')
    vi.stubEnv('VITE_BACKEND_PORT', '443')
    vi.stubEnv('VITE_BACKEND_USE_HTTPS', 'true')

    expect(getBackendBaseUrl()).toBe('https://api.example.com:443')
    expect(getBackendHealthUrl()).toBe('https://api.example.com:443/health')
    expect(getBackendWsBaseUrl()).toBe('wss://api.example.com:443')
    expect(getBackendTargetLabel()).toBe('api.example.com:443')
  })

  it('builds market list urls with start and limit', () => {
    expect(
      getMarketsUrl({
        exchange: 'upbit',
        quote: 'BTC',
        orderBy: 'price',
        orderDir: 'desc',
        start: 50,
        limit: 50,
      }),
    ).toBe(
      'http://127.0.0.1:8000/api/v1/markets?exchange=upbit&quote=BTC&order_by=price&order_dir=desc&start=50&limit=50',
    )
  })

  it('builds market list urls for bithumb exchange filters too', () => {
    expect(
      getMarketsUrl({
        exchange: 'bithumb',
        quote: 'KRW',
        orderBy: 'trade_amount_24h',
        orderDir: 'desc',
      }),
    ).toBe(
      'http://127.0.0.1:8000/api/v1/markets?exchange=bithumb&quote=KRW&order_by=trade_amount_24h&order_dir=desc&start=0&limit=50',
    )
  })

  it('builds market list urls for binance exchange filters too', () => {
    expect(
      getMarketsUrl({
        exchange: 'binance',
        quote: 'USDT',
        orderBy: 'trade_amount_24h',
        orderDir: 'desc',
      }),
    ).toBe(
      'http://127.0.0.1:8000/api/v1/markets?exchange=binance&quote=USDT&order_by=trade_amount_24h&order_dir=desc&start=0&limit=50',
    )
  })
})
