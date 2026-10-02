import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp } from '@electron-toolkit/utils'
import { registerDisplayMediaHandler } from '../displayCapture'
import { getOpenAiApiKey } from '../credentials'
import { createRealtimeTranscription } from '../../scripts/lib/runRealtimeTranscription'

const PROBE_CHANNELS = {
  pcm: 'probe:pcm',
  transcript: 'probe:transcript'
} as const

function probeHtmlPath(): string {
  return join(process.cwd(), 'src/renderer/probes/system-audio-probe.html')
}

function sendTranscript(window: BrowserWindow, payload: unknown): void {
  if (!window.isDestroyed()) {
    window.webContents.send(PROBE_CHANNELS.transcript, payload)
  }
}

export async function startSystemAudioProbe(): Promise<void> {
  await app.whenReady()

  electronApp.setAppUserModelId('com.personalapp.meetify.probe')
  registerDisplayMediaHandler()

  const language = process.env.TRANSCRIPTION_LANGUAGE ?? 'en'
  const apiKey = await getOpenAiApiKey()

  const probeWindow = new BrowserWindow({
    width: 480,
    height: 320,
    title: 'Meetify — system audio probe',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/systemAudioProbe.js'),
      sandbox: false
    }
  })

  const session = createRealtimeTranscription({
    apiKey,
    language,
    onReady: (eventType) => {
      console.log(`[ready] ${eventType}`)
      sendTranscript(probeWindow, { type: 'ready', eventType })
    },
    onDelta: (delta) => {
      process.stdout.write(`[delta] ${delta}`)
      sendTranscript(probeWindow, { type: 'delta', delta })
    },
    onUtterance: (text, itemId) => {
      console.log(`\n[utterance] (${itemId}) ${text}`)
      sendTranscript(probeWindow, { type: 'utterance', text, itemId })
    },
    onError: (message) => {
      console.error(`[error] ${message}`)
      sendTranscript(probeWindow, { type: 'error', message })
    }
  })

  ipcMain.on(PROBE_CHANNELS.pcm, (_event, pcm: ArrayBuffer) => {
    session.feedPcm(new Uint8Array(pcm))
  })

  probeWindow.on('closed', () => {
    ipcMain.removeAllListeners(PROBE_CHANNELS.pcm)
    session.stop()
  })

  await probeWindow.loadFile(probeHtmlPath())
  probeWindow.show()

  try {
    await session.start()
    console.log('[probe] system audio probe ready — click Start in the window')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    sendTranscript(probeWindow, { type: 'error', message })
    console.error(`[error] ${message}`)
  }
}
