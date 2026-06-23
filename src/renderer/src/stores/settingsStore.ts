import type { ApiKeyStatus, AppSettings } from '@shared/ipc'
import { listAudioInputDevices, type AudioInputDevice } from '@renderer/lib/audioDevices'
import { create } from 'zustand'

export type SettingsSection = 'audio' | 'aiProviders' | 'keybinds' | 'about'

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' }
] as const

const DEFAULT_API_KEY_STATUS: ApiKeyStatus = {
  configured: false,
  source: 'none'
}

const DEFAULT_DEVICE_LABEL = 'System default'

type SettingsState = {
  isOpen: boolean
  activeSection: SettingsSection
  isLoaded: boolean
  speechProvider: AppSettings['speechProvider']
  language: string
  inputDeviceId: string | null
  audioInputDevices: AudioInputDevice[]
  apiKeyStatus: ApiKeyStatus
  openSettings: () => void
  closeSettings: () => void
  setActiveSection: (section: SettingsSection) => void
  loadSettings: () => Promise<void>
  loadAudioDevices: () => Promise<void>
  loadApiKeyStatus: () => Promise<void>
  setLanguage: (language: string) => Promise<void>
  setInputDevice: (deviceId: string | null) => Promise<void>
  saveOpenAiApiKey: (apiKey: string) => Promise<void>
  clearOpenAiApiKey: () => Promise<void>
}

export const LANGUAGE_SETTING_OPTIONS = LANGUAGE_OPTIONS

export function getInputDeviceLabel(
  devices: AudioInputDevice[],
  deviceId: string | null
): string {
  if (!deviceId) {
    return DEFAULT_DEVICE_LABEL
  }

  return devices.find((device) => device.deviceId === deviceId)?.label ?? DEFAULT_DEVICE_LABEL
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isOpen: false,
  activeSection: 'audio',
  isLoaded: false,
  speechProvider: 'openai-realtime',
  language: 'en',
  inputDeviceId: null,
  audioInputDevices: [],
  apiKeyStatus: DEFAULT_API_KEY_STATUS,

  openSettings: () => {
    set({ isOpen: true })
    void get().loadApiKeyStatus()
    void get().loadAudioDevices()
  },

  closeSettings: () => set({ isOpen: false }),

  setActiveSection: (section) => set({ activeSection: section }),

  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get()
      set({
        isLoaded: true,
        speechProvider: settings.speechProvider,
        language: settings.language,
        inputDeviceId: settings.inputDeviceId
      })
    } catch {
      set({ isLoaded: true })
    }
  },

  loadAudioDevices: async () => {
    try {
      const granted = await window.api.recording.requestMicPermission()

      if (!granted) {
        return
      }

      const audioInputDevices = await listAudioInputDevices()
      set({ audioInputDevices })
    } catch (error) {
      console.error('Failed to load audio devices', error)
    }
  },

  loadApiKeyStatus: async () => {
    try {
      const apiKeyStatus = await window.api.credentials.getStatus()
      set({ apiKeyStatus })
    } catch {
      set({ apiKeyStatus: DEFAULT_API_KEY_STATUS })
    }
  },

  setLanguage: async (language) => {
    set({ language })

    try {
      const settings = await window.api.settings.set({ language })
      set({ language: settings.language })
    } catch (error) {
      console.error('Failed to save language setting', error)
      void get().loadSettings()
    }
  },

  setInputDevice: async (deviceId) => {
    set({ inputDeviceId: deviceId })

    try {
      const settings = await window.api.settings.set({ inputDeviceId: deviceId })
      set({ inputDeviceId: settings.inputDeviceId })
    } catch (error) {
      console.error('Failed to save input device', error)
      void get().loadSettings()
    }
  },

  saveOpenAiApiKey: async (apiKey) => {
    const apiKeyStatus = await window.api.credentials.setOpenAiApiKey(apiKey)
    set({ apiKeyStatus })
  },

  clearOpenAiApiKey: async () => {
    const apiKeyStatus = await window.api.credentials.clearOpenAiApiKey()
    set({ apiKeyStatus })
  }
}))
