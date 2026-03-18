import { useState } from 'react'

import {
  startTickerStream,
  stopTickerStream,
  triggerMarketSync,
} from '../api/settingsOperations'
import type {
  SettingsOperationState,
  SettingsOperationStateMap,
} from '../settings.types'
import type { MarketListExchange } from '../../market-chart/marketList.types'

type UseSettingsOperationsOptions = {
  onAfterAction?: () => Promise<void> | void
}

function toPendingState(): SettingsOperationState {
  return {
    status: 'pending',
    message: null,
  }
}

export function useSettingsOperations(
  options: UseSettingsOperationsOptions = {},
) {
  const [actionStates, setActionStates] = useState<SettingsOperationStateMap>({})

  const runAction = async (
    key: string,
    successMessage: string,
    action: () => Promise<void>,
  ) => {
    setActionStates((current) => ({
      ...current,
      [key]: toPendingState(),
    }))

    try {
      await action()

      setActionStates((current) => ({
        ...current,
        [key]: {
          status: 'success',
          message: successMessage,
        },
      }))

      try {
        await options.onAfterAction?.()
      } catch {
        // Runtime refresh failures are surfaced by the runtime card and
        // should not override the operation result that already succeeded.
      }
    } catch (nextError) {
      setActionStates((current) => ({
        ...current,
        [key]: {
          status: 'error',
          message:
            nextError instanceof Error
              ? nextError.message
              : '운영 작업에 실패했어요.',
        },
      }))
    }
  }

  return {
    actionStates,
    runMarketSync() {
      return runAction('market-sync', '동기화 완료', () => triggerMarketSync())
    },
    startExchangeStream(exchange: MarketListExchange) {
      return runAction(`start:${exchange}`, `${exchange} 시작 완료`, () =>
        startTickerStream(exchange),
      )
    },
    stopExchangeStream(exchange: MarketListExchange) {
      return runAction(`stop:${exchange}`, `${exchange} 중지 완료`, () =>
        stopTickerStream(exchange),
      )
    },
  }
}
