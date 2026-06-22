import { useDetailStore } from '@renderer/stores/detailStore'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import { create } from 'zustand'

type SessionNavigationState = {
  selectedSessionId: string | null
  past: (string | null)[]
  future: (string | null)[]
  navigateTo: (nextId: string | null) => void
  selectSession: (id: string) => void
  clearSelection: () => void
  goBack: () => void
  goForward: () => void
  deleteSession: (id: string) => void
}

function pruneHistory(history: (string | null)[], removedId: string): (string | null)[] {
  return history.filter((entry) => entry !== removedId)
}

export const useSessionNavigationStore = create<SessionNavigationState>((set, get) => ({
  selectedSessionId: null,
  past: [],
  future: [],

  navigateTo: (nextId) => {
    const currentId = get().selectedSessionId

    if (currentId === nextId) {
      return
    }

    set((state) => ({
      past: [...state.past, currentId],
      future: [],
      selectedSessionId: nextId
    }))
    useDetailStore.getState().resetDetail()
  },

  selectSession: (id) => {
    get().navigateTo(id)
  },

  clearSelection: () => {
    get().navigateTo(null)
  },

  goBack: () => {
    const { past, future, selectedSessionId } = get()

    if (past.length === 0) {
      return
    }

    const previousId = past[past.length - 1]

    set({
      past: past.slice(0, -1),
      future: [selectedSessionId, ...future],
      selectedSessionId: previousId
    })
    useDetailStore.getState().resetDetail()
  },

  goForward: () => {
    const { past, future, selectedSessionId } = get()

    if (future.length === 0) {
      return
    }

    const nextId = future[0]

    set({
      past: [...past, selectedSessionId],
      future: future.slice(1),
      selectedSessionId: nextId
    })
    useDetailStore.getState().resetDetail()
  },

  deleteSession: (id) => {
    const { selectedSessionId, past, future } = get()
    useSessionCatalogStore.getState().removeSession(id)

    const nextPast = pruneHistory(past, id)
    const nextFuture = pruneHistory(future, id)

    if (selectedSessionId === id) {
      set({
        selectedSessionId: null,
        past: nextPast,
        future: nextFuture
      })
      useDetailStore.getState().resetDetail()
      return
    }

    set({ past: nextPast, future: nextFuture })
  }
}))

export function useCanGoBack(): boolean {
  return useSessionNavigationStore((state) => state.past.length > 0)
}

export function useCanGoForward(): boolean {
  return useSessionNavigationStore((state) => state.future.length > 0)
}

export function useSelectedSession() {
  const selectedSessionId = useSessionNavigationStore((state) => state.selectedSessionId)
  const sessions = useSessionCatalogStore((state) => state.sessions)

  return sessions.find((session) => session.id === selectedSessionId)
}
