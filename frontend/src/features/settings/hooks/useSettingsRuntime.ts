import { useEffect, useState } from 'react'

import { getSettingsRuntime } from '../api/settings'
import type { SettingsRuntimeDocument } from '../settings.types'

export function useSettingsRuntime() {
  const [runtime, setRuntime] = useState<SettingsRuntimeDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const nextRuntime = await getSettingsRuntime()

        if (!isActive) {
          return
        }

        setRuntime(nextRuntime)
      } catch (nextError) {
        if (!isActive) {
          return
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : '진단 정보를 불러오지 못했어요.',
        )
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const nextRuntime = await getSettingsRuntime()

      setRuntime(nextRuntime)

      return nextRuntime
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '진단 정보를 불러오지 못했어요.',
      )

      throw nextError
    } finally {
      setRefreshing(false)
    }
  }

  return {
    runtime,
    loading,
    refreshing,
    error,
    refresh,
  }
}
