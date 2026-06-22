import { ipcMain, type WebContents } from 'electron'
import WebSocket from 'ws'
import {
  appendAudioChunk,
  buildSessionUpdateEvent,
  commitAudioBuffer,
  connectTranscriptionWebSocket,
  isSessionReadyEvent,
  parseServerEvent
} from './realtimeTranscriptionWs'

const COMMIT_INTERVAL_MS = 2000
const CONNECT_TIMEOUT_MS = 15_000

type SessionState = {
  ws: WebSocket
  sender: WebContents
  commitTimer: ReturnType<typeof setInterval> | null
  hasPendingAudio: boolean
  ready: Promise<void>
}

let session: SessionState | null = null
let closingIntentionally = false

function sendToRenderer(channel: string, payload: unknown): void {
  if (session?.sender && !session.sender.isDestroyed()) {
    session.sender.send(channel, payload)
  }
}

function cleanupSession(): void {
  if (!session) {
    return
  }

  const { ws, commitTimer } = session
  session = null

  if (commitTimer) {
    clearInterval(commitTimer)
  }

  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close()
  }
}

async function startSession(sender: WebContents): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set.')
  }

  if (session) {
    throw new Error('Transcription is already active.')
  }

  const ws = connectTranscriptionWebSocket(apiKey)

  let resolveReady!: () => void
  let rejectReady!: (error: Error) => void
  let isReady = false

  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })

  session = {
    ws,
    sender,
    commitTimer: null,
    hasPendingAudio: false,
    ready
  }

  const connectTimeout = setTimeout(() => {
    rejectReady(new Error('Timed out connecting to OpenAI Realtime API.'))
    cleanupSession()
  }, CONNECT_TIMEOUT_MS)

  ws.on('open', () => {
    ws.send(JSON.stringify(buildSessionUpdateEvent()))
  })

  ws.on('message', (raw) => {
    let event

    try {
      event = parseServerEvent(raw)
    } catch {
      const error = new Error('Failed to parse server event.')
      rejectReady(error)
      sendToRenderer('transcription:error', { message: error.message })
      cleanupSession()
      return
    }

    if (!isReady && isSessionReadyEvent(event.type)) {
      isReady = true
      clearTimeout(connectTimeout)
      resolveReady()

      if (session) {
        session.commitTimer = setInterval(() => {
          if (!session?.hasPendingAudio || session.ws.readyState !== WebSocket.OPEN) {
            return
          }

          commitAudioBuffer(session.ws)
          session.hasPendingAudio = false
        }, COMMIT_INTERVAL_MS)
      }

      return
    }

    if (event.type === 'conversation.item.input_audio_transcription.delta' && event.delta) {
      sendToRenderer('transcription:delta', { delta: event.delta })
      return
    }

    if (
      event.type === 'conversation.item.input_audio_transcription.failed' ||
      event.type === 'error'
    ) {
      const message = event.error?.message ?? 'Transcription failed.'
      sendToRenderer('transcription:error', { message })
      rejectReady(new Error(message))
      cleanupSession()
    }
  })

  ws.on('error', (err) => {
    clearTimeout(connectTimeout)
    const error = err instanceof Error ? err : new Error(String(err))
    rejectReady(error)
    sendToRenderer('transcription:error', { message: error.message })
    cleanupSession()
  })

  ws.on('close', (code) => {
    clearTimeout(connectTimeout)

    if (!closingIntentionally) {
      sendToRenderer('transcription:closed', {})
    }

    closingIntentionally = false

    if (!isReady && code !== 1000) {
      rejectReady(new Error(`WebSocket closed: ${code}`))
    }

    cleanupSession()
  })

  try {
    await ready
  } catch (error) {
    cleanupSession()
    throw error
  }
}

async function stopSession(): Promise<void> {
  if (!session) {
    return
  }

  const { ws, hasPendingAudio } = session
  closingIntentionally = true

  if (hasPendingAudio && ws.readyState === WebSocket.OPEN) {
    commitAudioBuffer(ws)
  }

  cleanupSession()
}

export function registerTranscriptionHandlers(): void {
  ipcMain.handle('transcription:start', async (event) => {
    await startSession(event.sender)
  })

  ipcMain.handle('transcription:stop', async () => {
    await stopSession()
  })

  ipcMain.on('transcription:audio', (_event, pcm: Uint8Array) => {
    if (!session) {
      return
    }

    void session.ready.then(() => {
      if (!session || session.ws.readyState !== WebSocket.OPEN) {
        return
      }

      appendAudioChunk(session.ws, pcm)
      session.hasPendingAudio = true
    })
  })
}
