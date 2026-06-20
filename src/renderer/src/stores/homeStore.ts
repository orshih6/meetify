import { create } from 'zustand'
import { recordingService } from '@renderer/lib/recordingService'

type HomeState = {
  isDetectable: boolean
  isRecording: boolean
  isStarting: boolean
  isStopping: boolean
  recordingError: string | null
  recordingWarning: string | null
  lastSavedPath: string | null
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
  lastSavedPath: null,
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
      lastSavedPath: null
    })

    try {
      const { warning } = await recordingService.start()

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
      const { filePath } = await recordingService.stop()

      set({
        isRecording: false,
        isStopping: false,
        recordingStartedAt: null,
        lastSavedPath: filePath
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
