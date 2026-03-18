import { getBackendBaseUrl } from '../../../config/backend'
import type {
  ResettableSettingsSection,
  ServerSettingsDocument,
  SettingsRuntimeDocument,
  SettingsUpdatePayload,
} from '../settings.types'

async function getResponseErrorMessage(response: Response) {
  const payload = await response.json().catch(() => null)

  if (typeof payload?.detail === 'string') {
    return payload.detail
  }

  if (typeof payload?.message === 'string') {
    return payload.message
  }

  return `요청에 실패했어요. (${response.status})`
}

async function requestJson<T>(path: string, init: RequestInit) {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, init)

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response))
  }

  return (await response.json()) as T
}

export function getServerSettings() {
  return requestJson<ServerSettingsDocument>('/api/v1/settings', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
}

export function saveServerSettings(payload: SettingsUpdatePayload) {
  return requestJson<ServerSettingsDocument>('/api/v1/settings', {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function resetServerSettingsSection(section: ResettableSettingsSection) {
  return requestJson<ServerSettingsDocument>('/api/v1/settings/reset', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ section }),
  })
}

export function getSettingsRuntime() {
  return requestJson<SettingsRuntimeDocument>('/api/v1/settings/runtime', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
}
