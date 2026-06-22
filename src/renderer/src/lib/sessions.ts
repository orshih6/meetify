import type { MeetingSession } from '@renderer/types/meeting'
import type { SavedSessionTranscript, SessionListEntry, SessionLoadResult } from '@shared/ipc'

const UNTITLED_SESSION_TITLE = 'Untitled'

export function meetingSessionFromListEntry(entry: SessionListEntry): MeetingSession {
  return {
    id: entry.sessionId,
    title: entry.title,
    startedAt: new Date(entry.startedAt),
    durationSeconds: entry.durationSeconds,
    summaryStatus: entry.summaryStatus
  }
}

export function meetingSessionFromLoadResult(result: SessionLoadResult): MeetingSession {
  return {
    id: result.sessionId,
    title: result.title,
    startedAt: new Date(result.startedAt),
    durationSeconds: result.durationSeconds,
    summary: result.summary,
    summaryStatus: result.summaryStatus,
    transcript: result.transcript.map(({ speaker, time, text }) => ({ speaker, time, text }))
  }
}

export function meetingSessionFromSave(
  sessionId: string,
  payload: SavedSessionTranscript
): MeetingSession {
  const startedAt = new Date(payload.startedAt)

  return {
    id: sessionId,
    title: UNTITLED_SESSION_TITLE,
    startedAt,
    durationSeconds: payload.durationSeconds,
    transcript: payload.transcript.map(({ speaker, time, text }) => ({ speaker, time, text })),
    summaryStatus: 'processing'
  }
}

export type SessionDateGroup = {
  label: string
  sessions: MeetingSession[]
}

export function groupSessionsByDate(
  sessions: MeetingSession[],
  now = new Date()
): SessionDateGroup[] {
  const groups = new Map<string, MeetingSession[]>()

  for (const session of sessions) {
    const label = formatDateGroupLabel(session.startedAt, now)
    const existing = groups.get(label)

    if (existing) {
      existing.push(session)
    } else {
      groups.set(label, [session])
    }
  }

  return [...groups.entries()].map(([label, groupedSessions]) => ({
    label,
    sessions: groupedSessions.toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
  }))
}

function formatDateGroupLabel(date: Date, now: Date): string {
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isSameDay) {
    return 'Today'
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}
