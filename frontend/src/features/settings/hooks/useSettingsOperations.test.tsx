import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSettingsOperations } from './useSettingsOperations'

const { startTickerStreamMock, stopTickerStreamMock, triggerMarketSyncMock } =
  vi.hoisted(() => {
    return {
      triggerMarketSyncMock: vi.fn(),
      startTickerStreamMock: vi.fn(),
      stopTickerStreamMock: vi.fn(),
    }
  })

vi.mock('../api/settingsOperations', () => {
  return {
    triggerMarketSync: triggerMarketSyncMock,
    startTickerStream: startTickerStreamMock,
    stopTickerStream: stopTickerStreamMock,
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useSettingsOperations', () => {
  it('운영 액션 상태를 저장 흐름과 별개로 관리한다', async () => {
    triggerMarketSyncMock.mockResolvedValue(undefined)
    startTickerStreamMock.mockRejectedValue(new Error('빗썸 시작 실패'))

    const afterAction = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useSettingsOperations({ onAfterAction: afterAction }),
    )

    await act(async () => {
      await result.current.runMarketSync()
    })

    await waitFor(() =>
      expect(result.current.actionStates['market-sync']?.status).toBe('success'),
    )
    expect(afterAction).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.startExchangeStream('bithumb')
    })

    await waitFor(() =>
      expect(result.current.actionStates['start:bithumb']?.status).toBe('error'),
    )
    expect(result.current.actionStates['market-sync']?.status).toBe('success')
    expect(result.current.actionStates['start:bithumb']?.message).toContain(
      '빗썸 시작 실패',
    )
  })

  it('다른 거래소 액션 상태를 개별 키로 분리한다', async () => {
    stopTickerStreamMock.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSettingsOperations())

    await act(async () => {
      await result.current.stopExchangeStream('upbit')
    })

    await waitFor(() =>
      expect(result.current.actionStates['stop:upbit']?.status).toBe('success'),
    )
    expect(result.current.actionStates['stop:bithumb']).toBeUndefined()
  })

  it('운영 액션 성공 후 runtime 새로고침이 실패해도 성공 상태를 유지한다', async () => {
    triggerMarketSyncMock.mockResolvedValue(undefined)

    const afterAction = vi.fn().mockRejectedValue(new Error('runtime refresh failed'))
    const { result } = renderHook(() =>
      useSettingsOperations({ onAfterAction: afterAction }),
    )

    await act(async () => {
      await result.current.runMarketSync()
    })

    await waitFor(() =>
      expect(result.current.actionStates['market-sync']?.status).toBe('success'),
    )
    expect(result.current.actionStates['market-sync']?.message).toBe('동기화 완료')
    expect(afterAction).toHaveBeenCalledTimes(1)
  })
})
