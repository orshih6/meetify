import { ipcMain, systemPreferences } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'

export function registerMicPermissionHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.recording.requestMicPermission, async () => {
    if (process.platform !== 'darwin') {
      return true
    }

    const status = systemPreferences.getMediaAccessStatus('microphone')

    if (status === 'granted') {
      return true
    }

    return systemPreferences.askForMediaAccess('microphone')
  })
}
