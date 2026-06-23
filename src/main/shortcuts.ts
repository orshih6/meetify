import { globalShortcut, type BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'

const SHORTCUTS = [
  { accelerator: 'CommandOrControl+,', channel: IPC_CHANNELS.shortcut.openSettings },
  { accelerator: 'CommandOrControl+R', channel: IPC_CHANNELS.shortcut.startRecording },
  { accelerator: 'CommandOrControl+Shift+R', channel: IPC_CHANNELS.shortcut.stopRecording }
] as const

export function registerGlobalShortcuts(getWindow: () => BrowserWindow | null): void {
  for (const { accelerator, channel } of SHORTCUTS) {
    globalShortcut.register(accelerator, () => {
      const window = getWindow()

      if (window && !window.isDestroyed()) {
        window.webContents.send(channel)
      }
    })
  }
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
}
