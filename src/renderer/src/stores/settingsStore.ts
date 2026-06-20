import { create } from 'zustand'

export type SettingsSection = 'general' | 'audio' | 'aiProviders' | 'keybinds' | 'about'

type SettingsState = {
  isOpen: boolean
  activeSection: SettingsSection
  openSettings: () => void
  closeSettings: () => void
  setActiveSection: (section: SettingsSection) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isOpen: false,
  activeSection: 'general',
  openSettings: () => set({ isOpen: true }),
  closeSettings: () => set({ isOpen: false }),
  setActiveSection: (section) => set({ activeSection: section })
}))
