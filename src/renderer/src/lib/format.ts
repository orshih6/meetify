import type { MeetingSession } from '@renderer/types/meeting'

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function formatSessionTime(date: Date): string {
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    .toLowerCase()
}

export function formatDateGroup(date: Date, now = new Date()): string {
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

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDetailDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
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
    const label = formatDateGroup(session.startedAt, now)
    const existing = groups.get(label)

    if (existing) {
      existing.push(session)
    } else {
      groups.set(label, [session])
    }
  }

  return [...groups.entries()].map(([label, groupedSessions]) => ({
    label,
    sessions: groupedSessions.sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
    )
  }))
}
