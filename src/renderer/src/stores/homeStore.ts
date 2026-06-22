import { create } from 'zustand'
import { realtimeTranscriptionService } from '@renderer/lib/realtimeTranscriptionService'

type HomeState = {
  isDetectable: boolean
  isRecording: boolean
  isStarting: boolean
  isStopping: boolean
  recordingError: string | null
  recordingWarning: string | null
  liveTranscript: string
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
  liveTranscript: '',
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
      liveTranscript: ''
    })

    try {
      const { warning } = await realtimeTranscriptionService.start((text) => {
        set((state) => ({ liveTranscript: state.liveTranscript + text }))
      })

      set({
        isRecording: true,
        isStarting: false,
        recordingStartedAt: Date.now(),
        recordingWarning: warning
      })
    } catch (error) {
      set({
        isStarting: false,
        isRecording: false,
        recordingStartedAt: null,
        recordingError: error instanceof Error ? error.message : 'Failed to start recording.'
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
      await realtimeTranscriptionService.stop()

      set({
        isRecording: false,
        isStopping: false,
        recordingStartedAt: null
      })
    } catch (error) {
      set({
        isRecording: false,
        isStopping: false,
        recordingStartedAt: null,
        recordingError: error instanceof Error ? error.message : 'Failed to stop recording.'
      })
    }
  }
}))
