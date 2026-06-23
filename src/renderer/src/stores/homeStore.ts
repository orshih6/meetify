import {
  createRecordingPipeline,
  getLiveDisplayTextBySource,
  type RecordingPipeline
} from '@renderer/lib/recording'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import type { TranscriptSource } from '@shared/ipc'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

const recordingPipeline: RecordingPipeline = createRecordingPipeline()

type HomeState = {
  isRecording: boolean
  isStarting: boolean
  isStopping: boolean
  recordingError: string | null
  recordingWarning: string | null
  recordingStartedAt: number | null
  activeSources: TranscriptSource[]
  liveTranscriptVersion: number
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  getLiveTranscriptBySource: () => { me: string; them: string }
}

let pipelineUnsubscribe: (() => void) | null = null

export const useHomeStore = create<HomeState>((set, get) => ({
  isRecording: false,
  isStarting: false,
  isStopping: false,
  recordingError: null,
  recordingWarning: null,
  recordingStartedAt: null,
  activeSources: [],
  liveTranscriptVersion: 0,

  getLiveTranscriptBySource: () => ({
    me: getLiveDisplayTextBySource(recordingPipeline.getTranscriptState(), 'me'),
    them: getLiveDisplayTextBySource(recordingPipeline.getTranscriptState(), 'interviewer')
  }),

  startRecording: async () => {
    const { isRecording, isStarting } = get()

    if (isRecording || isStarting) {
      return
    }

    set({
      isStarting: true,
      recordingError: null,
      recordingWarning: null,
      recordingStartedAt: null,
      activeSources: []
    })

    pipelineUnsubscribe?.()
    pipelineUnsubscribe = recordingPipeline.subscribe((event) => {
      if (event.type === 'error') {
        set({ recordingError: event.message })
      }

      if (event.type === 'delta' || event.type === 'utterance') {
        set((state) => ({ liveTranscriptVersion: state.liveTranscriptVersion + 1 }))
      }

      if (event.type === 'closed') {
        set({
          recordingWarning: `Transcription stream closed (${event.source}).`
        })
      }
    })

    try {
      const startedAt = Date.now()
      const { warning, sources } = await recordingPipeline.start()

      set({
        isRecording: true,
        isStarting: false,
        recordingStartedAt: startedAt,
        recordingWarning: warning,
        activeSources: sources
      })
    } catch (error) {
      pipelineUnsubscribe?.()
      pipelineUnsubscribe = null
      set({
        isStarting: false,
        isRecording: false,
        recordingStartedAt: null,
        activeSources: [],
        recordingError: toErrorMessage(error, 'Failed to start recording.')
      })
    }
  },

  stopRecording: async () => {
    const { isRecording, isStopping } = get()

    if (!isRecording || isStopping) {
      return
    }

    set({ isStopping: true, recordingError: null })

    try {
      const { sessionId, saveError } = await recordingPipeline.stop()

      pipelineUnsubscribe?.()
      pipelineUnsubscribe = null

      if (sessionId) {
        const loaded = await window.api.session.load(sessionId)

        if (loaded) {
          useSessionCatalogStore.getState().addSessionFromLoad(loaded)
          void useSessionCatalogStore.getState().requestTitle(sessionId)
          void useSessionCatalogStore.getState().requestSummary(sessionId)
        }
      }

      set((state) => ({
        isRecording: false,
        isStopping: false,
        recordingStartedAt: null,
        activeSources: [],
        liveTranscriptVersion: state.liveTranscriptVersion + 1,
        recordingError: saveError
      }))
    } catch (error) {
      pipelineUnsubscribe?.()
      pipelineUnsubscribe = null
      set({
        isRecording: false,
        isStopping: false,
        recordingStartedAt: null,
        activeSources: [],
        recordingError: toErrorMessage(error, 'Failed to stop recording.')
      })
    }
  }
}))

export function useHomeRecording() {
  return useHomeStore(
    useShallow((state) => ({
      isRecording: state.isRecording,
      isStarting: state.isStarting,
      isStopping: state.isStopping,
      recordingError: state.recordingError,
      recordingWarning: state.recordingWarning,
      recordingStartedAt: state.recordingStartedAt,
      startRecording: state.startRecording,
      stopRecording: state.stopRecording
    }))
  )
}

export function useLiveTranscriptBySource(): {
  me: string
  them: string
  hasInterviewer: boolean
} {
  const version = useHomeStore((state) => state.liveTranscriptVersion)
  const activeSources = useHomeStore((state) => state.activeSources)
  void version
  const { me, them } = useHomeStore.getState().getLiveTranscriptBySource()

  return {
    me,
    them,
    hasInterviewer: activeSources.includes('interviewer')
  }
}
