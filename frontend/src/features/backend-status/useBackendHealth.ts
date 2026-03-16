import { useEffect, useState } from 'react'

import { getBackendHealthUrl, getBackendTargetLabel } from '../../config/backend'

export type BackendHealthStatus = 'checking' | 'online' | 'offline'

export function useBackendHealth(pollIntervalMs = 1000) {
  const [status, setStatus] = useState<BackendHealthStatus>('checking')

  useEffect(() => {
    let isActive = true

    const checkBackendHealth = async () => {
      try {
        const response = await fetch(getBackendHealthUrl())

        if (!isActive) {
          return
        }

        setStatus(response.ok ? 'online' : 'offline')
      } catch {
        if (!isActive) {
          return
        }

        setStatus('offline')
      }
    }

    void checkBackendHealth()

    const intervalId = window.setInterval(() => {
      void checkBackendHealth()
    }, pollIntervalMs)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [pollIntervalMs])

  return {
    status,
    target: getBackendTargetLabel(),
  }
}
