import { useSessionsStore } from '@renderer/stores/sessionsStore'
import { create } from 'zustand'

type NavigationState = {
  past: (string | null)[]
  future: (string | null)[]
  navigateTo: (nextId: string | null) => void
  goBack: () => void
  goForward: () => void
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  past: [],
  future: [],
  navigateTo: (nextId) => {
    const currentId = useSessionsStore.getState().selectedSessionId

    if (currentId === nextId) {
      return
    }

    set((state) => ({
      past: [...state.past, currentId],
      future: []
    }))
    useSessionsStore.setState({ selectedSessionId: nextId })
  },
  goBack: () => {
    const { past, future } = get()

    if (past.length === 0) {
      return
    }

    const currentId = useSessionsStore.getState().selectedSessionId
    const previousId = past[past.length - 1]

    set({
      past: past.slice(0, -1),
      future: [currentId, ...future]
    })
    useSessionsStore.setState({ selectedSessionId: previousId })
  },
  goForward: () => {
    const { past, future } = get()

    if (future.length === 0) {
      return
    }

    const currentId = useSessionsStore.getState().selectedSessionId
    const nextId = future[0]

    set({
      past: [...past, currentId],
      future: future.slice(1)
    })
    useSessionsStore.setState({ selectedSessionId: nextId })
  }
}))

export function useCanGoBack(): boolean {
  return useNavigationStore((state) => state.past.length > 0)
}

export function useCanGoForward(): boolean {
  return useNavigationStore((state) => state.future.length > 0)
}
