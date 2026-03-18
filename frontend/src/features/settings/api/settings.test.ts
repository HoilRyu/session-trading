import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getSettingsRuntime,
  getServerSettings,
  resetServerSettingsSection,
  saveServerSettings,
} from './settings'

const settingsFixture = {
  general: {
    default_exchange: 'upbit',
    default_route: '/market-chart',
  },
  market_data: {
    default_quote: 'KRW',
    default_order_by: 'trade_amount_24h',
    default_order_dir: 'desc',
    poll_interval_ms: 1000,
    auto_refresh_enabled: true,
    page_size: 50,
    exchanges: {
      upbit: { enabled: true },
      bithumb: { enabled: true },
      binance: { enabled: true },
    },
  },
  chart: {
    default_exchange: 'upbit',
    default_symbol: 'KRW-BTC',
    default_interval: '60',
    theme: 'light',
    show_volume: true,
    price_format_mode: 'auto',
  },
  ops: {
    market_sync_on_boot: false,
    exchanges: {
      upbit: { auto_start: false, ticker_enabled: true },
      bithumb: { auto_start: false, ticker_enabled: true },
      binance: { auto_start: false, ticker_enabled: true },
    },
  },
} as const

const runtimeFixture = {
  environment: 'local',
  backend_status: 'online',
  target: '127.0.0.1:8000',
  exchanges: {
    upbit: {
      status: 'running',
      subscribed_market_count: 3,
      buffered_event_count: 1,
      last_error: null,
      last_received_at: '2026-03-18T04:00:00Z',
      last_flushed_at: '2026-03-18T04:00:00Z',
    },
    bithumb: {
      status: 'stopped',
      subscribed_market_count: 0,
      buffered_event_count: 0,
      last_error: 'not started',
      last_received_at: null,
      last_flushed_at: null,
    },
    binance: {
      status: 'running',
      subscribed_market_count: 3,
      buffered_event_count: 1,
      last_error: null,
      last_received_at: '2026-03-18T03:59:59Z',
      last_flushed_at: '2026-03-18T04:00:00Z',
    },
  },
} as const

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('settings api client', () => {
  it('설정 문서를 조회한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => settingsFixture,
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(getServerSettings()).resolves.toEqual(settingsFixture)
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/api/v1/settings', {
      headers: { Accept: 'application/json' },
      method: 'GET',
    })
  })

  it('설정 patch를 저장한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => settingsFixture,
    })

    vi.stubGlobal('fetch', fetchMock)

    await saveServerSettings({
      general: {
        default_exchange: 'bithumb',
      },
      chart: {
        default_interval: '240',
      },
    })

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/api/v1/settings', {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        general: {
          default_exchange: 'bithumb',
        },
        chart: {
          default_interval: '240',
        },
      }),
    })
  })

  it('섹션 기본값 복원을 요청한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => settingsFixture,
    })

    vi.stubGlobal('fetch', fetchMock)

    await resetServerSettingsSection('market_data')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/settings/reset',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section: 'market_data' }),
      },
    )
  })

  it('런타임 상태를 조회한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => runtimeFixture,
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(getSettingsRuntime()).resolves.toEqual(runtimeFixture)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/settings/runtime',
      {
        headers: { Accept: 'application/json' },
        method: 'GET',
      },
    )
  })
})
