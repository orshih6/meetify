import { createAudioCapture } from '@renderer/lib/recording/audioCapture'
import { createDefaultRecordingApi, type RecordingApi } from '@renderer/lib/recording/ipcAdapter'
import {
  appendDelta,
  createLiveTranscriptState,
  finalizeUtterance,
  getLiveDisplayTextBySource,
  getPendingPartialEntries,
  type LiveTranscriptState
} from '@renderer/lib/recording/transcriptState'
import type { TranscriptSource } from '@shared/ipc'

export type RecordingEvent =
  | {
      type: 'delta'
      source: TranscriptSource
      itemId: string
      delta: string
      itemStartedAtMs?: number
    }
  | {
      type: 'utterance'
      source: TranscriptSource
      itemId: string
      text: string
      itemStartedAtMs: number
    }
  | { type: 'error'; message: string; source?: TranscriptSource }
  | { type: 'closed'; source: TranscriptSource }

type Unsubscribe = () => void

export type RecordingPipeline = {
  start: () => Promise<{ warning: string | null; sources: TranscriptSource[] }>
  stop: () => Promise<{
    sessionId: string | null
    saveError: string | null
  }>
  subscribe: (listener: (event: RecordingEvent) => void) => Unsubscribe
  getDisplayTextBySource: (source: TranscriptSource) => string
  getTranscriptState: () => LiveTranscriptState
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function createRecordingPipeline(deps?: { api?: RecordingApi }): RecordingPipeline {
  const api = deps?.api ?? createDefaultRecordingApi()
  const capture = createAudioCapture(api)

  let liveTranscriptState = createLiveTranscriptState()
  let recordingStartedAt: number | null = null
  let sessionId: string | null = null
  let listeners: Array<(event: RecordingEvent) => void> = []
  let ipcUnsubscribes: Unsubscribe[] = []

  function emit(event: RecordingEvent): void {
    for (const listener of listeners) {
      listener(event)
    }
  }

  function handleTranscriptionEvent(event: RecordingEvent): void {
    if (recordingStartedAt === null) {
      return
    }

    if (event.type === 'delta') {
      liveTranscriptState = appendDelta(
        liveTranscriptState,
        event.source,
        event.itemId,
        event.delta,
        event.itemStartedAtMs
      )
    } else if (event.type === 'utterance') {
      liveTranscriptState = finalizeUtterance(
        liveTranscriptState,
        event.source,
        event.itemId,
        event.text,
        event.itemStartedAtMs
      )
    }

    emit(event)
  }

  function subscribe(listener: (event: RecordingEvent) => void): Unsubscribe {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((item) => item !== listener)
    }
  }

  return {
    subscribe,

    getDisplayTextBySource(source: TranscriptSource): string {
      return getLiveDisplayTextBySource(liveTranscriptState, source)
    },

    getTranscriptState(): LiveTranscriptState {
      return liveTranscriptState
    },

    async start(): Promise<{ warning: string | null; sources: TranscriptSource[] }> {
      liveTranscriptState = createLiveTranscriptState()
      recordingStartedAt = Date.now()
      sessionId = null

      ipcUnsubscribes = [
        api.transcription.onDelta(({ source, itemId, delta, itemStartedAtMs }) => {
          handleTranscriptionEvent({ type: 'delta', source, itemId, delta, itemStartedAtMs })
        }),
        api.transcription.onUtterance(({ source, itemId, text, itemStartedAtMs }) => {
          handleTranscriptionEvent({
            type: 'utterance',
            source,
            itemId,
            text,
            itemStartedAtMs
          })
        }),
        api.transcription.onError(({ message, source }) => {
          emit({
            type: 'error',
            message: message ?? 'Transcription error.',
            source
          })
        }),
        api.transcription.onClosed(({ source }) => {
          emit({ type: 'closed', source })
        })
      ]

      const { warning, sources } = await capture.prepare()
      const startResult = await api.transcription.start(sources)
      sessionId = startResult.sessionId

      capture.beginProcessing((source, pcm) => {
        api.transcription.sendAudio(source, pcm)
      })

      return { warning, sources }
    },

    async stop(): Promise<{
      sessionId: string | null
      saveError: string | null
    }> {
      capture.stop()

      for (const unsubscribe of ipcUnsubscribes) {
        unsubscribe()
      }
      ipcUnsubscribes = []

      const activeSessionId = sessionId
      recordingStartedAt = null
      sessionId = null

      if (activeSessionId === null) {
        await api.transcription.stop().catch(() => undefined)
        return { sessionId: null, saveError: null }
      }

      try {
        const pendingEntries = getPendingPartialEntries(liveTranscriptState)

        for (const entry of pendingEntries) {
          await api.session.appendTranscript({ sessionId: activeSessionId, entry })
        }

        const { sessionId: finalizedSessionId } = await api.transcription.stop()

        return { sessionId: finalizedSessionId, saveError: null }
      } catch (error) {
        return {
          sessionId: null,
          saveError: toErrorMessage(error, 'Failed to save session.')
        }
      }
    }
  }
}
