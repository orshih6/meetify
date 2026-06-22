import { meetingSessionFromTranscript } from '@renderer/lib/sessions'
import type { MeetingSession } from '@renderer/types/meeting'
import type { SavedSessionTranscript } from '@shared/ipc'
import { create } from 'zustand'

type SessionCatalogState = {
  sessions: MeetingSession[]
  isLoading: boolean
  loadError: string | null
  loadCatalog: () => Promise<void>
  addSessionFromTranscript: (filename: string, payload: SavedSessionTranscript) => MeetingSession
  removeSession: (id: string) => void
  exportSession: (id: string) => void
}

export const useSessionCatalogStore = create<SessionCatalogState>((set, get) => ({
  sessions: [],
  isLoading: false,
  loadError: null,

  loadCatalog: async () => {
    set({ isLoading: true, loadError: null })

    try {
      const entries = await window.api.transcript.list()
      const sessions: MeetingSession[] = []

      for (const entry of entries) {
        const payload = await window.api.transcript.load(entry.filename)

        if (payload) {
          sessions.push(meetingSessionFromTranscript(entry.filename, payload))
        }
      }

      set({ sessions, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        loadError: error instanceof Error ? error.message : 'Failed to load sessions.'
      })
    }
  },

  addSessionFromTranscript: (filename, payload) => {
    const session = meetingSessionFromTranscript(filename, payload)

    set((state) => ({
      sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)]
    }))

    return session
  },

  removeSession: (id) => {
    set((state) => ({
      sessions: state.sessions.filter((session) => session.id !== id)
    }))
  },

  exportSession: (id) => {
    const session = get().sessions.find((item) => item.id === id)
    console.log('Export session', session?.title ?? id)
  }
}))
