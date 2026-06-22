import { app, desktopCapturer, ipcMain, session, systemPreferences } from 'electron'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

type SavedTranscriptEntry = {
  speaker: string
  time: string
  text: string
  elapsedSeconds: number
}

type SavedSessionTranscript = {
  startedAt: string
  durationSeconds: number
  transcript: SavedTranscriptEntry[]
}

export function registerDisplayMediaHandler(): void {
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer
      .getSources({ types: ['screen'] })
      .then((sources) => {
        const source = sources[0]

        if (!source) {
          callback({})
          return
        }

        callback({
          video: source,
          audio: 'loopback'
        })
      })
      .catch(() => {
        callback({})
      })
  })
}

export function registerRecordingHandlers(): void {
  ipcMain.handle('recording:request-mic-permission', async () => {
    if (process.platform !== 'darwin') {
      return true
    }

    const status = systemPreferences.getMediaAccessStatus('microphone')

    if (status === 'granted') {
      return true
    }

    return systemPreferences.askForMediaAccess('microphone')
  })

  ipcMain.handle(
    'recording:save',
    async (_event, buffer: Uint8Array, filename: string): Promise<string> => {
      const recordingsDir = join(app.getPath('userData'), 'recordings')
      await mkdir(recordingsDir, { recursive: true })

      const filePath = join(recordingsDir, filename)
      await writeFile(filePath, buffer)

      return filePath
    }
  )

  ipcMain.handle(
    'transcript:save',
    async (_event, payload: SavedSessionTranscript, filename: string): Promise<string> => {
      const transcriptsDir = join(app.getPath('userData'), 'transcripts')
      await mkdir(transcriptsDir, { recursive: true })

      const filePath = join(transcriptsDir, filename)
      await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')

      return filePath
    }
  )
}
