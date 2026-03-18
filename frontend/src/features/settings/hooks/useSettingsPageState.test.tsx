import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ServerSettingsDocument } from '../settings.types'
import { useSettingsPageState } from './useSettingsPageState'

const settingsFixture: ServerSettingsDocument = {
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
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('useSettingsPageState', () => {
  it('저장 실패 시 값을 유지하고 변경된 섹션에 오류를 남긴다', async () => {
    const saveMock = vi.fn().mockRejectedValue(new Error('설정 저장 실패'))
    const resetMock = vi.fn()
    const { result } = renderHook(() =>
      useSettingsPageState({
        settings: settingsFixture,
        onSave: saveMock,
        onResetSection: resetMock,
      }),
    )

    act(() => {
      result.current.updateGeneral({
        default_exchange: 'bithumb',
      })
    })

    expect(result.current.draft.general.default_exchange).toBe('bithumb')
    expect(result.current.dirtySections.general).toBe(true)

    await act(async () => {
      await result.current.save()
    })

    await waitFor(() => expect(result.current.saveStatus).toBe('error'))
    expect(result.current.draft.general.default_exchange).toBe('bithumb')
    expect(result.current.sectionErrors.general).toContain('설정 저장 실패')
    expect(resetMock).not.toHaveBeenCalled()
  })

  it('섹션 복원은 general, market_data, chart만 별도로 적용한다', async () => {
    const resetMock = vi.fn().mockResolvedValue({
      ...settingsFixture,
      general: {
        ...settingsFixture.general,
        default_exchange: 'binance',
      },
    })

    const { result } = renderHook(() =>
      useSettingsPageState({
        settings: settingsFixture,
        onSave: vi.fn(),
        onResetSection: resetMock,
      }),
    )

    act(() => {
      result.current.updateGeneral({
        default_exchange: 'bithumb',
      })
    })

    await act(async () => {
      await result.current.resetSection('general')
    })

    expect(resetMock).toHaveBeenCalledWith('general')
    await waitFor(() =>
      expect(result.current.draft.general.default_exchange).toBe('binance'),
    )
    expect(result.current.sectionErrors.general).toBeNull()
  })

  it('섹션 복원은 다른 섹션의 저장하지 않은 draft를 유지한다', async () => {
    const resetMock = vi.fn().mockResolvedValue({
      ...settingsFixture,
      general: {
        ...settingsFixture.general,
        default_exchange: 'binance',
      },
    })

    const { result } = renderHook(() =>
      useSettingsPageState({
        settings: settingsFixture,
        onSave: vi.fn(),
        onResetSection: resetMock,
      }),
    )

    act(() => {
      result.current.updateGeneral({
        default_exchange: 'bithumb',
      })
      result.current.updateChart({
        theme: 'dark',
      })
    })

    await act(async () => {
      await result.current.resetSection('general')
    })

    await waitFor(() =>
      expect(result.current.draft.general.default_exchange).toBe('binance'),
    )
    expect(result.current.draft.chart.theme).toBe('dark')
    expect(result.current.dirtySections.chart).toBe(true)
    expect(result.current.sectionErrors.general).toBeNull()
  })
})
