import type { MeetingSession } from '@renderer/types/meeting'
import { formatDetailDate, formatSessionTime } from '@renderer/lib/format'
import type { SavedSessionTranscript } from '@shared/ipc'

export function transcriptFilenameToId(filename: string): string {
  return filename.replace(/\.json$/, '')
}

export function meetingSessionFromTranscript(
  filename: string,
  payload: SavedSessionTranscript
): MeetingSession {
  const startedAt = new Date(payload.startedAt)
  const id = transcriptFilenameToId(filename)

  return {
    id,
    title: `Recording ${formatDetailDate(startedAt)} ${formatSessionTime(startedAt)}`,
    startedAt,
    durationSeconds: payload.durationSeconds,
    transcript: payload.transcript.map(({ speaker, time, text }) => ({ speaker, time, text })),
    transcriptFilename: filename
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
