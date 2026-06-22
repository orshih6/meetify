import {
  createRecordingPipeline,
  getLiveDisplayText,
  type RecordingPipeline
} from '@renderer/lib/recording'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

const recordingPipeline: RecordingPipeline = createRecordingPipeline()

type HomeState = {
  isDetectable: boolean
  isRecording: boolean
  isStarting: boolean
  isStopping: boolean
  recordingError: string | null
  recordingWarning: string | null
  recordingStartedAt: number | null
  liveTranscriptVersion: number
  toggleDetectable: () => void
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  getLiveTranscriptText: () => string
}

let pipelineUnsubscribe: (() => void) | null = null

export const useHomeStore = create<HomeState>((set, get) => ({
  isDetectable: false,
  isRecording: false,
  isStarting: false,
  isStopping: false,
  recordingError: null,
  recordingWarning: null,
  recordingStartedAt: null,
  liveTranscriptVersion: 0,

  getLiveTranscriptText: () => getLiveDisplayText(recordingPipeline.getTranscriptState()),

  toggleDetectable: () => set((state) => ({ isDetectable: !state.isDetectable })),

  startRecording: async () => {
    const { isRecording, isStarting } = get()

    if (isRecording || isStarting) {
      return
    }

    set({
      isStarting: true,
      recordingError: null,
      recordingWarning: null,
      recordingStartedAt: null
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
      const { warning } = await recordingPipeline.start()

      set({
        isRecording: true,
        isStarting: false,
        recordingStartedAt: startedAt,
        recordingWarning: warning
      })
    } catch (error) {
      pipelineUnsubscribe?.()
      pipelineUnsubscribe = null
      set({
        isStarting: false,
        isRecording: false,
        recordingStartedAt: null,
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
      const { payload, sessionId, saveError } = await recordingPipeline.stop()

      pipelineUnsubscribe?.()
      pipelineUnsubscribe = null

      if (payload && sessionId) {
        useSessionCatalogStore.getState().addSessionFromSave(sessionId, payload)
        void useSessionCatalogStore.getState().requestSummary(sessionId)
      }

      set((state) => ({
        isRecording: false,
        isStopping: false,
        recordingStartedAt: null,
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
        recordingError: toErrorMessage(error, 'Failed to stop recording.')
      })
    }
  }
}))

export function useHomeRecording() {
  return useHomeStore(
    useShallow((state) => ({
      isDetectable: state.isDetectable,
      isRecording: state.isRecording,
      isStarting: state.isStarting,
      isStopping: state.isStopping,
      recordingError: state.recordingError,
      recordingWarning: state.recordingWarning,
      recordingStartedAt: state.recordingStartedAt,
      toggleDetectable: state.toggleDetectable,
      startRecording: state.startRecording,
      stopRecording: state.stopRecording
    }))
  )
}

export function useLiveTranscriptDisplay(): string {
  const version = useHomeStore((state) => state.liveTranscriptVersion)
  void version
  return useHomeStore.getState().getLiveTranscriptText()
}
