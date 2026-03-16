import { afterEach, vi } from 'vitest'

import {
  getBackendBaseUrl,
  getBackendHealthUrl,
  getBackendTargetLabel,
  getBackendWsBaseUrl,
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
})
