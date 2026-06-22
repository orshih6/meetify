import { ipcMain, type WebContents } from 'electron'
import WebSocket from 'ws'
import { IPC_CHANNELS, type TranscriptionAudioPayload, type TranscriptSource } from '@shared/ipc'
import { getAppSettings } from './settingsPersistence'
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

const ALL_SOURCES: TranscriptSource[] = ['me', 'interviewer']

type SessionState = {
  source: TranscriptSource
  ws: WebSocket
  commitTimer: ReturnType<typeof setInterval> | null
  hasPendingAudio: boolean
  ready: Promise<void>
  closingIntentionally: boolean
}

type ActiveTranscription = {
  sender: WebContents
  sessions: Map<TranscriptSource, SessionState>
}

let active: ActiveTranscription | null = null

function sendToRenderer(channel: string, payload: unknown): void {
  if (active?.sender && !active.sender.isDestroyed()) {
    active.sender.send(channel, payload)
  }
}

function cleanupSession(source: TranscriptSource): void {
  if (!active) {
    return
  }

  const session = active.sessions.get(source)

  if (!session) {
    return
  }

  if (session.commitTimer) {
    clearInterval(session.commitTimer)
  }

  if (session.ws.readyState === WebSocket.OPEN || session.ws.readyState === WebSocket.CONNECTING) {
    session.ws.close()
  }

  active.sessions.delete(source)

  if (active.sessions.size === 0) {
    active = null
  }
}

function cleanupAllSessions(): void {
  if (!active) {
    return
  }

  for (const source of [...active.sessions.keys()]) {
    cleanupSession(source)
  }
}

async function createSession(
  source: TranscriptSource,
  sender: WebContents,
  apiKey: string
): Promise<void> {
  const ws = connectTranscriptionWebSocket(apiKey)
  const language = getAppSettings().language

  let resolveReady!: () => void
  let rejectReady!: (error: Error) => void
  let isReady = false

  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })

  const session: SessionState = {
    source,
    ws,
    commitTimer: null,
    hasPendingAudio: false,
    ready,
    closingIntentionally: false
  }

  if (!active) {
    active = { sender, sessions: new Map() }
  }

  active.sessions.set(source, session)

  const connectTimeout = setTimeout(() => {
    rejectReady(new Error(`Timed out connecting to OpenAI Realtime API (${source}).`))
    cleanupSession(source)
  }, CONNECT_TIMEOUT_MS)

  ws.on('open', () => {
    ws.send(JSON.stringify(buildSessionUpdateEvent(language)))
  })

  ws.on('message', (raw) => {
    let event

    try {
      event = parseServerEvent(raw)
    } catch {
      const error = new Error('Failed to parse server event.')
      rejectReady(error)
      sendToRenderer(IPC_CHANNELS.transcription.error, { message: error.message, source })
      cleanupSession(source)
      return
    }

    if (!isReady && isSessionReadyEvent(event.type)) {
      isReady = true
      clearTimeout(connectTimeout)
      resolveReady()

      session.commitTimer = setInterval(() => {
        if (!session.hasPendingAudio || session.ws.readyState !== WebSocket.OPEN) {
          return
        }

        commitAudioBuffer(session.ws)
        session.hasPendingAudio = false
      }, COMMIT_INTERVAL_MS)

      return
    }

    if (event.type === 'conversation.item.input_audio_transcription.delta' && event.delta) {
      sendToRenderer(IPC_CHANNELS.transcription.delta, { source, delta: event.delta })
      return
    }

    if (
      event.type === 'conversation.item.input_audio_transcription.completed' &&
      event.transcript
    ) {
      sendToRenderer(IPC_CHANNELS.transcription.utterance, { source, text: event.transcript })
      return
    }

    if (
      event.type === 'conversation.item.input_audio_transcription.failed' ||
      event.type === 'error'
    ) {
      const message = event.error?.message ?? 'Transcription failed.'
      sendToRenderer(IPC_CHANNELS.transcription.error, { message, source })
      rejectReady(new Error(message))
      cleanupSession(source)
    }
  })

  ws.on('error', (err) => {
    clearTimeout(connectTimeout)
    const error = err instanceof Error ? err : new Error(String(err))
    rejectReady(error)
    sendToRenderer(IPC_CHANNELS.transcription.error, { message: error.message, source })
    cleanupSession(source)
  })

  ws.on('close', (code) => {
    clearTimeout(connectTimeout)

    if (!session.closingIntentionally) {
      sendToRenderer(IPC_CHANNELS.transcription.closed, { source })
    }

    session.closingIntentionally = false

    if (!isReady && code !== 1000) {
      rejectReady(new Error(`WebSocket closed (${source}): ${code}`))
    }

    cleanupSession(source)
  })

  await ready
}

async function startSessions(sender: WebContents, sources: TranscriptSource[]): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set.')
  }

  if (active) {
    throw new Error('Transcription is already active.')
  }

  const uniqueSources = [...new Set(sources)]

  for (const source of uniqueSources) {
    if (!ALL_SOURCES.includes(source)) {
      throw new Error(`Unknown transcription source: ${source}`)
    }
  }

  active = { sender, sessions: new Map() }

  try {
    await Promise.all(uniqueSources.map((source) => createSession(source, sender, apiKey)))
  } catch (error) {
    cleanupAllSessions()
    throw error
  }
}

async function stopSessions(): Promise<void> {
  if (!active) {
    return
  }

  for (const session of active.sessions.values()) {
    session.closingIntentionally = true

    if (session.hasPendingAudio && session.ws.readyState === WebSocket.OPEN) {
      commitAudioBuffer(session.ws)
    }
  }

  cleanupAllSessions()
}

export function registerTranscriptionHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.transcription.start, async (event, sources: TranscriptSource[]) => {
    await startSessions(event.sender, sources)
  })

  ipcMain.handle(IPC_CHANNELS.transcription.stop, async () => {
    await stopSessions()
  })

  ipcMain.on(IPC_CHANNELS.transcription.audio, (_event, payload: TranscriptionAudioPayload) => {
    const session = active?.sessions.get(payload.source)

    if (!session) {
      return
    }

    void session.ready.then(() => {
      const current = active?.sessions.get(payload.source)

      if (!current || current.ws.readyState !== WebSocket.OPEN) {
        return
      }

      appendAudioChunk(current.ws, payload.pcm)
      current.hasPendingAudio = true
    })
  })
}
