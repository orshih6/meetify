import { create } from 'zustand'

const TRANSCRIPTION_UNAVAILABLE = 'Live transcription is not available.'

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

    set({ recordingError: TRANSCRIPTION_UNAVAILABLE })
  },
  stopRecording: async () => {
    const { isRecording, isStopping } = get()

    if (!isRecording || isStopping) {
      return
    }
  }
}))
