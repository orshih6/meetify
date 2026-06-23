import type { MeetingSession } from '@renderer/types/meeting'
import type { SessionListEntry, SessionLoadResult } from '@shared/ipc'
import { formatEntryTime } from '@shared/transcript'

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
  const recordingStartedAtMs = new Date(result.startedAt).getTime()

  return {
    id: result.sessionId,
    title: result.title,
    startedAt: new Date(result.startedAt),
    durationSeconds: result.durationSeconds,
    summary: result.summary,
    summaryStatus: result.summaryStatus,
    transcript: result.transcript.map((entry) => ({
      speaker: entry.speaker,
      time: formatEntryTime(entry.itemStartedAtMs, recordingStartedAtMs),
      text: entry.text
    }))
  }
}

export function meetingSessionFromLoad(result: SessionLoadResult): MeetingSession {
  return meetingSessionFromLoadResult(result)
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
