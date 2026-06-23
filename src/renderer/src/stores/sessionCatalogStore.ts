import {
  meetingSessionFromListEntry,
  meetingSessionFromLoadResult
} from '@renderer/lib/sessions'
import { useSessionNavigationStore } from '@renderer/stores/sessionNavigationStore'
import type { MeetingSession } from '@renderer/types/meeting'
import type { SessionLoadResult } from '@shared/ipc'
import { create } from 'zustand'

const UNTITLED_SESSION_TITLE = 'Untitled'

type SessionCatalogState = {
  sessions: MeetingSession[]
  isLoading: boolean
  loadError: string | null
  loadCatalog: () => Promise<void>
  addSessionFromLoad: (result: SessionLoadResult) => MeetingSession
  requestTitle: (sessionId: string) => Promise<void>
  requestSummary: (sessionId: string) => Promise<void>
  loadSessionDetail: (sessionId: string) => Promise<MeetingSession | null>
  deleteSession: (sessionId: string) => Promise<void>
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

function resumeIncompleteSessions(sessions: MeetingSession[]): void {
  const store = useSessionCatalogStore.getState()

  for (const session of sessions) {
    if (session.summaryStatus === 'processing') {
      void store.requestSummary(session.id)
    }

    if (session.title === UNTITLED_SESSION_TITLE) {
      void store.requestTitle(session.id)
    }
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
      resumeIncompleteSessions(sessions)
    } catch (error) {
      set({
        isLoading: false,
        loadError: error instanceof Error ? error.message : 'Failed to load sessions.'
      })
    }
  },

  addSessionFromLoad: (result) => {
    const session = meetingSessionFromLoadResult(result)

    set((state) => ({
      sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)]
    }))

    return session
  },

  requestTitle: async (sessionId) => {
    try {
      const { title } = await window.api.title.generate(sessionId)

      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId ? { ...session, title } : session
        )
      }))
    } catch {
      // Keep the Untitled placeholder on failure.
    }
  },

  requestSummary: async (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId ? { ...session, summaryStatus: 'processing' } : session
      )
    }))

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
  },

  deleteSession: async (sessionId) => {
    await window.api.session.delete(sessionId)

    set((state) => ({
      sessions: state.sessions.filter((session) => session.id !== sessionId)
    }))

    useSessionNavigationStore.getState().removeSessionFromHistory(sessionId)
  }
}))
