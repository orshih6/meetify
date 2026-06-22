import { app, ipcMain } from 'electron'
import { mkdir, readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { IPC_CHANNELS, type SavedSessionTranscript, type TranscriptListEntry } from '@shared/ipc'

function transcriptsDir(): string {
  return join(app.getPath('userData'), 'transcripts')
}

export function registerTranscriptPersistenceHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.transcript.save,
    async (_event, payload: SavedSessionTranscript, filename: string): Promise<string> => {
      const dir = transcriptsDir()
      await mkdir(dir, { recursive: true })

      const filePath = join(dir, filename)
      await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')

      return filePath
    }
  )

  ipcMain.handle(IPC_CHANNELS.transcript.list, async (): Promise<TranscriptListEntry[]> => {
    const dir = transcriptsDir()

    try {
      await mkdir(dir, { recursive: true })
      const files = await readdir(dir)
      const jsonFiles = files.filter((name) => name.endsWith('.json'))
      const entries: TranscriptListEntry[] = []

      for (const filename of jsonFiles) {
        try {
          const raw = await readFile(join(dir, filename), 'utf8')
          const payload = JSON.parse(raw) as SavedSessionTranscript
          entries.push({
            filename,
            startedAt: payload.startedAt,
            durationSeconds: payload.durationSeconds
          })
        } catch {
          // skip corrupt files
        }
      }

      return entries.toSorted(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )
    } catch {
      return []
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.transcript.load,
    async (_event, filename: string): Promise<SavedSessionTranscript | null> => {
      try {
        const raw = await readFile(join(transcriptsDir(), filename), 'utf8')
        return JSON.parse(raw) as SavedSessionTranscript
      } catch {
        return null
      }
    }
  )
}
