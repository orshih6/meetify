import { create } from 'zustand'
import { mockSessions } from '@renderer/data/mockSessions'
import { useNavigationStore } from '@renderer/stores/navigationStore'
import type { MeetingSession } from '@renderer/types/meeting'

type SessionsState = {
  sessions: MeetingSession[]
  selectedSessionId: string | null
  selectSession: (id: string) => void
  clearSelection: () => void
  deleteSession: (id: string) => void
  exportSession: (id: string) => void
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: mockSessions,
  selectedSessionId: null,
  selectSession: (id) => useNavigationStore.getState().navigateTo(id),
  clearSelection: () => useNavigationStore.getState().navigateTo(null),
  deleteSession: (id) => {
    const { selectedSessionId } = get()

    set((state) => ({
      sessions: state.sessions.filter((session) => session.id !== id),
      selectedSessionId: selectedSessionId === id ? null : selectedSessionId
    }))
  },
  exportSession: (id) => {
    const session = get().sessions.find((item) => item.id === id)

    console.log('Export session', session?.title ?? id)
  }
}))

export function useSelectedSession(): MeetingSession | undefined {
  return useSessionsStore((state) =>
    state.sessions.find((session) => session.id === state.selectedSessionId)
  )
}
