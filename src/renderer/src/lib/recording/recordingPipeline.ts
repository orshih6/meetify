import { createAudioCapture } from '@renderer/lib/recording/audioCapture'
import { createDefaultRecordingApi, type RecordingApi } from '@renderer/lib/recording/ipcAdapter'
import {
  appendDelta,
  buildSavedSessionTranscript,
  createLiveTranscriptState,
  finalizePartialOnEnd,
  finalizeUtterance,
  getLiveDisplayText,
  makeTranscriptFilename,
  TRANSCRIPT_SOURCES,
  type LiveTranscriptState
} from '@renderer/lib/recording/transcriptState'
import type { SavedSessionTranscript, TranscriptSource } from '@shared/ipc'

export type RecordingEvent =
  | { type: 'delta'; source: TranscriptSource; delta: string }
  | { type: 'utterance'; source: TranscriptSource; text: string }
  | { type: 'error'; message: string; source?: TranscriptSource }
  | { type: 'closed'; source: TranscriptSource }

type Unsubscribe = () => void

export type RecordingPipeline = {
  start: () => Promise<{ warning: string | null }>
  stop: () => Promise<{
    payload: SavedSessionTranscript | null
    filename: string | null
    saveError: string | null
  }>
  subscribe: (listener: (event: RecordingEvent) => void) => Unsubscribe
  getDisplayText: () => string
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

    const startedAt = recordingStartedAt

    if (event.type === 'delta') {
      liveTranscriptState = appendDelta(liveTranscriptState, event.source, event.delta)
    } else if (event.type === 'utterance') {
      liveTranscriptState = finalizeUtterance(
        liveTranscriptState,
        event.source,
        event.text,
        startedAt
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

    getDisplayText(): string {
      return getLiveDisplayText(liveTranscriptState)
    },

    getTranscriptState(): LiveTranscriptState {
      return liveTranscriptState
    },

    async start(): Promise<{ warning: string | null }> {
      liveTranscriptState = createLiveTranscriptState()
      recordingStartedAt = Date.now()

      ipcUnsubscribes = [
        api.transcription.onDelta(({ source, delta }) => {
          handleTranscriptionEvent({ type: 'delta', source, delta })
        }),
        api.transcription.onUtterance(({ source, text }) => {
          handleTranscriptionEvent({ type: 'utterance', source, text })
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
      await api.transcription.start(sources)

      capture.beginProcessing((source, pcm) => {
        api.transcription.sendAudio(source, pcm)
      })

      return { warning }
    },

    async stop(): Promise<{
      payload: SavedSessionTranscript | null
      filename: string | null
      saveError: string | null
    }> {
      capture.stop()

      for (const unsubscribe of ipcUnsubscribes) {
        unsubscribe()
      }
      ipcUnsubscribes = []

      await api.transcription.stop()

      const stoppedAt = Date.now()
      const startedAt = recordingStartedAt
      recordingStartedAt = null

      if (startedAt === null) {
        return { payload: null, filename: null, saveError: null }
      }

      for (const source of TRANSCRIPT_SOURCES) {
        liveTranscriptState = finalizePartialOnEnd(liveTranscriptState, source, startedAt)
      }

      if (liveTranscriptState.entries.length === 0) {
        return { payload: null, filename: null, saveError: null }
      }

      const payload = buildSavedSessionTranscript(liveTranscriptState, startedAt, stoppedAt)
      const filename = makeTranscriptFilename(startedAt)

      try {
        await api.transcript.save(payload, filename)
        return { payload, filename, saveError: null }
      } catch (error) {
        return {
          payload,
          filename,
          saveError: toErrorMessage(error, 'Failed to save transcript file.')
        }
      }
    }
  }
}
