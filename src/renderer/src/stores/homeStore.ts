import { create } from 'zustand'

type HomeState = {
  isDetectable: boolean
  isRecording: boolean
  toggleDetectable: () => void
  startRecording: () => void
  stopRecording: () => void
}

export const useHomeStore = create<HomeState>((set) => ({
  isDetectable: false,
  isRecording: false,
  toggleDetectable: () => set((state) => ({ isDetectable: !state.isDetectable })),
  startRecording: () => {
    console.log('Start recording')
    set({ isRecording: true })
  },
  stopRecording: () => {
    console.log('Stop recording')
    set({ isRecording: false })
  }
}))
