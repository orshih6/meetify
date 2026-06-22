import {
  BeakerIcon,
  CommandLineIcon,
  InformationCircleIcon,
  MicrophoneIcon
} from '@heroicons/react/16/solid'
import type { SettingsSection } from '@renderer/stores/settingsStore'

export type SettingsNavItem = {
  id: SettingsSection
  label: string
  icon: typeof MicrophoneIcon
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: 'audio', label: 'Audio', icon: MicrophoneIcon },
  { id: 'aiProviders', label: 'AI Providers', icon: BeakerIcon },
  { id: 'keybinds', label: 'Keybinds', icon: CommandLineIcon },
  { id: 'about', label: 'About', icon: InformationCircleIcon }
]
