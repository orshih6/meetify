import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import {
  appendDelta,
  buildSavedSessionTranscript,
  createLiveTranscriptState,
  finalizePartialOnEnd,
  finalizeUtterance,
  makeTranscriptFilename,
  TRANSCRIPT_SOURCES,
  type LiveTranscriptState
} from '@renderer/lib/liveTranscript'
import { realtimeTranscriptionService } from '@renderer/lib/realtimeTranscriptionService'

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

type HomeState = {
  isDetectable: boolean
  isRecording: boolean
  isStarting: boolean
  isStopping: boolean
  recordingError: string | null
  recordingWarning: string | null
  liveTranscriptState: LiveTranscriptState
  recordingStartedAt: number | null
  toggleDetectable: () => void
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
}

export const useHomeStore = create<HomeState>((set, get) => ({
  isDetectable: false,
  isRecording: false,
  isStarting: false,
  isStopping: false,
  recordingError: null,
  recordingWarning: null,
  liveTranscriptState: createLiveTranscriptState(),
  recordingStartedAt: null,
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
      liveTranscriptState: createLiveTranscriptState()
    })

    try {
      const recordingStartedAt = Date.now()

      const { warning } = await realtimeTranscriptionService.start((event) => {
        set((state) => {
          const startedAt = state.recordingStartedAt ?? recordingStartedAt

          if (event.type === 'delta') {
            return {
              liveTranscriptState: appendDelta(state.liveTranscriptState, event.source, event.delta)
            }
          }

          if (event.type === 'utterance') {
            return {
              liveTranscriptState: finalizeUtterance(
                state.liveTranscriptState,
                event.source,
                event.text,
                startedAt
              )
            }
          }

          return state
        })
      })

      set({
        isRecording: true,
        isStarting: false,
        recordingStartedAt,
        recordingWarning: warning
      })
    } catch (error) {
      set({
        isStarting: false,
        isRecording: false,
        recordingStartedAt: null,
        recordingError: toErrorMessage(error, 'Failed to start recording.')
      })
    }
  },
  stopRecording: async () => {
    const { isRecording, isStopping, recordingStartedAt } = get()

    if (!isRecording || isStopping) {
      return
    }

    set({ isStopping: true, recordingError: null })

    try {
      await realtimeTranscriptionService.stop()

      const stoppedAt = Date.now()
      let saveError: string | null = null
      let nextLiveTranscriptState = get().liveTranscriptState

      if (recordingStartedAt !== null) {
        for (const source of TRANSCRIPT_SOURCES) {
          nextLiveTranscriptState = finalizePartialOnEnd(
            nextLiveTranscriptState,
            source,
            recordingStartedAt
          )
        }

        if (nextLiveTranscriptState.entries.length > 0) {
          try {
            const payload = buildSavedSessionTranscript(
              nextLiveTranscriptState,
              recordingStartedAt,
              stoppedAt
            )
            const filename = makeTranscriptFilename(recordingStartedAt)
            await window.api.transcript.save(payload, filename)
          } catch (error) {
            saveError = toErrorMessage(error, 'Failed to save transcript file.')
          }
        }
      }

      set({
        isRecording: false,
        isStopping: false,
        recordingStartedAt: null,
        liveTranscriptState: nextLiveTranscriptState,
        recordingError: saveError
      })
    } catch (error) {
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
