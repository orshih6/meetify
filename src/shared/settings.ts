export type ApiKeyStatus = {
  configured: boolean
  source: 'settings' | 'env' | 'none'
}

export type AppSettings = {
  speechProvider: 'openai-realtime'
  language: string
  inputDeviceId: string | null
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  speechProvider: 'openai-realtime',
  language: 'en',
  inputDeviceId: null
}
