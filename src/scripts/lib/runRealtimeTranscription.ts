import {
  appendAudioChunk,
  buildSessionUpdateEvent,
  commitAudioBuffer,
  connectTranscriptionWebSocket,
  isSessionReadyEvent,
  parseServerEvent
} from '../../main/realtimeTranscriptionWs'

const COMMIT_INTERVAL_MS = 2000
const CONNECT_TIMEOUT_MS = 15_000

type RealtimeTranscriptionCallbacks = {
  apiKey: string
  language?: string
  onReady?: (eventType: string) => void
  onDelta?: (delta: string, itemId: string) => void
  onUtterance?: (text: string, itemId: string) => void
  onError?: (message: string) => void
}

type RealtimeTranscriptionSession = {
  feedPcm: (pcm: Uint8Array) => void
  start: () => Promise<void>
  stop: () => void
}

export function createRealtimeTranscription(
  callbacks: RealtimeTranscriptionCallbacks
): RealtimeTranscriptionSession {
  const { apiKey, language, onReady, onDelta, onUtterance, onError } = callbacks

  let ws: WebSocket | null = null
  let commitTimer: ReturnType<typeof setInterval> | null = null
  let hasPendingAudio = false
  let connectTimeout: ReturnType<typeof setTimeout> | null = null
  let isReady = false

  function cleanup(): void {
    if (connectTimeout) {
      clearTimeout(connectTimeout)
      connectTimeout = null
    }

    if (commitTimer) {
      clearInterval(commitTimer)
      commitTimer = null
    }

    if (ws && (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING)) {
      ws.close()
    }

    ws = null
    hasPendingAudio = false
    isReady = false
  }

  function fail(error: Error): void {
    onError?.(error.message)
    cleanup()
  }

  async function start(): Promise<void> {
    cleanup()

    let resolveReady!: () => void
    let rejectReady!: (error: Error) => void

    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve
      rejectReady = reject
    })

    ws = connectTranscriptionWebSocket(apiKey)

    connectTimeout = setTimeout(() => {
      rejectReady(new Error('Timed out connecting to OpenAI Realtime API.'))
      cleanup()
    }, CONNECT_TIMEOUT_MS)

    ws.on('open', () => {
      ws?.send(JSON.stringify(buildSessionUpdateEvent(language)))
    })

    ws.on('message', (raw) => {
      let event

      try {
        event = parseServerEvent(raw)
      } catch {
        fail(new Error('Failed to parse server event.'))
        rejectReady(new Error('Failed to parse server event.'))
        return
      }

      if (!isReady && isSessionReadyEvent(event.type)) {
        isReady = true

        if (connectTimeout) {
          clearTimeout(connectTimeout)
          connectTimeout = null
        }

        onReady?.(event.type)
        resolveReady()

        commitTimer = setInterval(() => {
          if (!hasPendingAudio || !ws || ws.readyState !== ws.OPEN) {
            return
          }

          commitAudioBuffer(ws)
          hasPendingAudio = false
        }, COMMIT_INTERVAL_MS)

        return
      }

      if (
        event.type === 'conversation.item.input_audio_transcription.delta' &&
        event.delta &&
        event.item_id
      ) {
        onDelta?.(event.delta, event.item_id)
        return
      }

      if (
        event.type === 'conversation.item.input_audio_transcription.completed' &&
        event.transcript &&
        event.item_id
      ) {
        onUtterance?.(event.transcript, event.item_id)
        return
      }

      if (
        event.type === 'conversation.item.input_audio_transcription.failed' ||
        event.type === 'error'
      ) {
        const message = event.error?.message ?? 'Transcription failed.'
        onError?.(message)
        rejectReady(new Error(message))
        cleanup()
      }
    })

    ws.on('error', (err) => {
      const error = err instanceof Error ? err : new Error(String(err))
      fail(error)
      rejectReady(error)
    })

    ws.on('close', (code) => {
      if (!isReady && code !== 1000) {
        rejectReady(new Error(`WebSocket closed: ${code}`))
      }

      cleanup()
    })

    await ready
  }

  function feedPcm(pcm: Uint8Array): void {
    if (!ws || ws.readyState !== ws.OPEN || !isReady) {
      return
    }

    appendAudioChunk(ws, pcm)
    hasPendingAudio = true
  }

  function stop(): void {
    if (ws && hasPendingAudio && ws.readyState === ws.OPEN) {
      commitAudioBuffer(ws)
      hasPendingAudio = false
    }

    cleanup()
  }

  return { feedPcm, start, stop }
}
