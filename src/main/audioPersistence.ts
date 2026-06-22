import { app, ipcMain } from 'electron'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { IPC_CHANNELS } from '@shared/ipc'

/** Raw audio file persistence — exposed via IPC but not wired from renderer yet. */
export function registerAudioPersistenceHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.recording.save,
    async (_event, buffer: Uint8Array, filename: string): Promise<string> => {
      const recordingsDir = join(app.getPath('userData'), 'recordings')
      await mkdir(recordingsDir, { recursive: true })

      const filePath = join(recordingsDir, filename)
      await writeFile(filePath, buffer)

      return filePath
    }
  )
}
