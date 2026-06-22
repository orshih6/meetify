import type { ApiKeyStatus, AppSettings } from '@shared/ipc'
import { create } from 'zustand'

export type SettingsSection = 'general' | 'audio' | 'aiProviders' | 'keybinds' | 'about'

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' }
] as const

export const SPEECH_PROVIDER_OPTIONS = [
  { label: 'OpenAI Realtime', value: 'openai-realtime' as const, enabled: true },
  { label: 'Whisper (coming soon)', value: 'whisper' as const, enabled: false },
  { label: 'Deepgram (coming soon)', value: 'deepgram' as const, enabled: false },
  { label: 'AssemblyAI (coming soon)', value: 'assemblyai' as const, enabled: false }
]

const DEFAULT_API_KEY_STATUS: ApiKeyStatus = {
  configured: false,
  source: 'none'
}

type SettingsState = {
  isOpen: boolean
  activeSection: SettingsSection
  isLoaded: boolean
  speechProvider: AppSettings['speechProvider']
  language: string
  apiKeyStatus: ApiKeyStatus
  openSettings: () => void
  closeSettings: () => void
  setActiveSection: (section: SettingsSection) => void
  loadSettings: () => Promise<void>
  loadApiKeyStatus: () => Promise<void>
  setLanguage: (language: string) => Promise<void>
  saveOpenAiApiKey: (apiKey: string) => Promise<void>
  clearOpenAiApiKey: () => Promise<void>
}

export const LANGUAGE_SETTING_OPTIONS = LANGUAGE_OPTIONS

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isOpen: false,
  activeSection: 'general',
  isLoaded: false,
  speechProvider: 'openai-realtime',
  language: 'en',
  apiKeyStatus: DEFAULT_API_KEY_STATUS,

  openSettings: () => {
    set({ isOpen: true })
    void get().loadApiKeyStatus()
  },

  closeSettings: () => set({ isOpen: false }),

  setActiveSection: (section) => set({ activeSection: section }),

  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get()
      set({
        isLoaded: true,
        speechProvider: settings.speechProvider,
        language: settings.language
      })
    } catch {
      set({ isLoaded: true })
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

  saveOpenAiApiKey: async (apiKey) => {
    const apiKeyStatus = await window.api.credentials.setOpenAiApiKey(apiKey)
    set({ apiKeyStatus })
  },

  clearOpenAiApiKey: async () => {
    const apiKeyStatus = await window.api.credentials.clearOpenAiApiKey()
    set({ apiKeyStatus })
  }
}))
