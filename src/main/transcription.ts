import { ipcMain, type WebContents } from 'electron'
import WebSocket from 'ws'
import { buildTranscriptEntry } from '@shared/transcript'
import { IPC_CHANNELS, type TranscriptionAudioPayload, type TranscriptSource } from '@shared/ipc'
import {
  appendTranscriptEntry,
  createRecordingSession,
  deleteMeetingSession,
  finalizeRecordingSession
} from '../mastra/meetingRepository'
import { getElectronMemoryStore } from './mastraStorage'
import { getAppSettings } from './settingsPersistence'
import { getOpenAiApiKey } from './credentials'
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
  itemStartedAtMs: Map<string, number>
}

type ActiveTranscription = {
  sender: WebContents
  sessionId: string
  startedAt: string
  startedAtMs: number
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

async function persistCompletedUtterance(
  source: TranscriptSource,
  transcript: string,
  itemId: string,
  session: SessionState
): Promise<number> {
  if (!active) {
    return Date.now()
  }

  const itemStartedAtMs = session.itemStartedAtMs.get(itemId) ?? Date.now()
  const entry = buildTranscriptEntry({ source, text: transcript, itemId, itemStartedAtMs })
  const memory = getElectronMemoryStore()

  await appendTranscriptEntry(memory, active.sessionId, entry, active.startedAt)

  return itemStartedAtMs
}

async function createSession(
  source: TranscriptSource,
  apiKey: string,
  language: string
): Promise<void> {
  const ws = connectTranscriptionWebSocket(apiKey)

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
    closingIntentionally: false,
    itemStartedAtMs: new Map()
  }

  if (!active) {
    throw new Error('Active transcription is not initialized.')
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

    if (event.type === 'input_audio_buffer.committed' && event.item_id) {
      session.itemStartedAtMs.set(event.item_id, Date.now())
      return
    }

    if (
      event.type === 'conversation.item.input_audio_transcription.delta' &&
      event.delta &&
      event.item_id
    ) {
      const itemStartedAtMs = session.itemStartedAtMs.get(event.item_id)
      sendToRenderer(IPC_CHANNELS.transcription.delta, {
        source,
        itemId: event.item_id,
        contentIndex: event.content_index,
        delta: event.delta,
        itemStartedAtMs
      })
      return
    }

    if (
      event.type === 'conversation.item.input_audio_transcription.completed' &&
      event.transcript &&
      event.item_id
    ) {
      void persistCompletedUtterance(source, event.transcript, event.item_id, session)
        .then((itemStartedAtMs) => {
          sendToRenderer(IPC_CHANNELS.transcription.utterance, {
            source,
            itemId: event.item_id!,
            text: event.transcript!,
            itemStartedAtMs
          })
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Failed to save transcript.'
          sendToRenderer(IPC_CHANNELS.transcription.error, { message, source })
        })

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

async function startSessions(sender: WebContents, sources: TranscriptSource[]): Promise<string> {
  const apiKey = await getOpenAiApiKey()

  if (active) {
    throw new Error('Transcription is already active.')
  }

  const uniqueSources = [...new Set(sources)]

  for (const source of uniqueSources) {
    if (!ALL_SOURCES.includes(source)) {
      throw new Error(`Unknown transcription source: ${source}`)
    }
  }

  const startedAtMs = Date.now()
  const startedAt = new Date(startedAtMs).toISOString()
  const memory = getElectronMemoryStore()
  const sessionId = await createRecordingSession(memory, startedAt)
  const language = getAppSettings().language

  active = { sender, sessionId, startedAt, startedAtMs, sessions: new Map() }

  try {
    await Promise.all(uniqueSources.map((source) => createSession(source, apiKey, language)))
  } catch (error) {
    cleanupAllSessions()
    await deleteMeetingSession(memory, sessionId)
    active = null
    throw error
  }

  return sessionId
}

async function stopSessions(): Promise<{ sessionId: string | null; entryCount: number }> {
  if (!active) {
    return { sessionId: null, entryCount: 0 }
  }

  const { sessionId } = active

  for (const session of active.sessions.values()) {
    session.closingIntentionally = true

    if (session.hasPendingAudio && session.ws.readyState === WebSocket.OPEN) {
      commitAudioBuffer(session.ws)
    }
  }

  cleanupAllSessions()

  const memory = getElectronMemoryStore()
  const stoppedAt = Date.now()
  const { entryCount } = await finalizeRecordingSession(memory, sessionId, stoppedAt)

  if (entryCount === 0) {
    await deleteMeetingSession(memory, sessionId)
    return { sessionId: null, entryCount: 0 }
  }

  return { sessionId, entryCount }
}

export function registerTranscriptionHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.transcription.start, async (event, sources: TranscriptSource[]) => {
    const sessionId = await startSessions(event.sender, sources)
    return { sessionId }
  })

  ipcMain.handle(IPC_CHANNELS.transcription.stop, async () => {
    return stopSessions()
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
