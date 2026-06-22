import {
  meetingSessionFromListEntry,
  meetingSessionFromLoadResult,
  meetingSessionFromSave
} from '@renderer/lib/sessions'
import type { MeetingSession } from '@renderer/types/meeting'
import type { SavedSessionTranscript } from '@shared/ipc'
import { create } from 'zustand'

type SessionCatalogState = {
  sessions: MeetingSession[]
  isLoading: boolean
  loadError: string | null
  loadCatalog: () => Promise<void>
  addSessionFromSave: (sessionId: string, payload: SavedSessionTranscript) => MeetingSession
  requestSummary: (sessionId: string) => Promise<void>
  loadSessionDetail: (sessionId: string) => Promise<MeetingSession | null>
}

function mergeSession(existing: MeetingSession | undefined, next: MeetingSession): MeetingSession {
  return {
    ...existing,
    ...next,
    transcript: next.transcript ?? existing?.transcript,
    summary: next.summary ?? existing?.summary,
    summaryStatus: next.summaryStatus ?? existing?.summaryStatus
  }
}

export const useSessionCatalogStore = create<SessionCatalogState>((set) => ({
  sessions: [],
  isLoading: false,
  loadError: null,

  loadCatalog: async () => {
    set({ isLoading: true, loadError: null })

    try {
      const entries = await window.api.session.list()
      const sessions = entries.map(meetingSessionFromListEntry)

      set({ sessions, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        loadError: error instanceof Error ? error.message : 'Failed to load sessions.'
      })
    }
  },

  addSessionFromSave: (sessionId, payload) => {
    const session = meetingSessionFromSave(sessionId, payload)

    set((state) => ({
      sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)]
    }))

    return session
  },

  requestSummary: async (sessionId) => {
    try {
      const { summary } = await window.api.summary.generate(sessionId)

      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId ? { ...session, summary, summaryStatus: 'ready' } : session
        )
      }))
    } catch {
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId ? { ...session, summaryStatus: 'error' } : session
        )
      }))
    }
  },

  loadSessionDetail: async (sessionId) => {
    const result = await window.api.session.load(sessionId)

    if (!result) {
      return null
    }

    const session = meetingSessionFromLoadResult(result)

    set((state) => ({
      sessions: state.sessions.map((item) =>
        item.id === sessionId ? mergeSession(item, session) : item
      )
    }))

    return session
  }
}))
