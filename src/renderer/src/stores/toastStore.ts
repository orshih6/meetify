import { create } from 'zustand'

type ToastState = {
  message: string | null
  showToast: (message: string) => void
  clearToast: () => void
}

let dismissTimer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastState>((set) => ({
  message: null,

  showToast: (message) => {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
    }

    set({ message })

    dismissTimer = setTimeout(() => {
      set({ message: null })
      dismissTimer = null
    }, 2000)
  },

  clearToast: () => {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }

    set({ message: null })
  }
}))
