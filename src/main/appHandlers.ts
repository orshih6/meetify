import { app, ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.app.getVersion, (): string => {
    return app.getVersion()
  })
}
