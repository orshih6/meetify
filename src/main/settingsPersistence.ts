import { app, ipcMain } from 'electron'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { DEFAULT_APP_SETTINGS, IPC_CHANNELS, type AppSettings } from '@shared/ipc'

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

let cachedSettings: AppSettings | null = null

export function getAppSettings(): AppSettings {
  return cachedSettings ?? { ...DEFAULT_APP_SETTINGS }
}

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(settingsPath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    cachedSettings = {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      speechProvider: 'openai-realtime',
      inputDeviceId: parsed.inputDeviceId ?? null
    }
    return cachedSettings
  } catch {
    cachedSettings = { ...DEFAULT_APP_SETTINGS }
    return cachedSettings
  }
}

async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const dir = app.getPath('userData')
  await mkdir(dir, { recursive: true })
  cachedSettings = { ...settings, speechProvider: 'openai-realtime' }
  await writeFile(settingsPath(), JSON.stringify(cachedSettings, null, 2), 'utf8')
  return cachedSettings
}

export function registerSettingsHandlers(): void {
  void loadSettings()

  ipcMain.handle(IPC_CHANNELS.settings.get, async (): Promise<AppSettings> => {
    return loadSettings()
  })

  ipcMain.handle(IPC_CHANNELS.settings.set, async (_event, partial: Partial<AppSettings>) => {
    const current = await loadSettings()
    return saveSettings({ ...current, ...partial })
  })
}
