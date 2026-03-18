import { useEffect, useState } from 'react'

import {
  getServerSettings,
  resetServerSettingsSection,
  saveServerSettings,
} from '../api/settings'
import type {
  ResettableSettingsSection,
  ServerSettingsDocument,
  SettingsUpdatePayload,
} from '../settings.types'

export function useServerSettings() {
  const [settings, setSettings] = useState<ServerSettingsDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const nextSettings = await getServerSettings()

        if (!isActive) {
          return
        }

        setSettings(nextSettings)
      } catch (nextError) {
        if (!isActive) {
          return
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : '설정을 불러오지 못했어요.',
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
    setLoading(true)
    setError(null)

    try {
      const nextSettings = await getServerSettings()

      setSettings(nextSettings)

      return nextSettings
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '설정을 불러오지 못했어요.',
      )

      throw nextError
    } finally {
      setLoading(false)
    }
  }

  const persist = async (payload: SettingsUpdatePayload) => {
    const nextSettings = await saveServerSettings(payload)

    setSettings(nextSettings)

    return nextSettings
  }

  const resetSection = async (section: ResettableSettingsSection) => {
    const nextSettings = await resetServerSettingsSection(section)

    setSettings(nextSettings)

    return nextSettings
  }

  return {
    settings,
    loading,
    error,
    refresh,
    saveSettings: persist,
    resetSection,
  }
}
