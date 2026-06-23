import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'
import { clearOpenAiApiKey, getOpenAiApiKeyStatus, setOpenAiApiKey } from './credentials'

export function registerCredentialsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.credentials.getStatus, () => {
    return getOpenAiApiKeyStatus()
  })

  ipcMain.handle(IPC_CHANNELS.credentials.setOpenAiApiKey, async (_event, apiKey: string) => {
    await setOpenAiApiKey(apiKey)
    return getOpenAiApiKeyStatus()
  })

  ipcMain.handle(IPC_CHANNELS.credentials.clearOpenAiApiKey, async () => {
    await clearOpenAiApiKey()
    return getOpenAiApiKeyStatus()
  })
}
