import type { MeetingSession } from '@renderer/types/meeting'
import { formatDuration } from '@shared/transcript'

const AUTO_RECORDING_TITLE_PREFIX = /^Recording\s/i
const UNTITLED_SESSION_TITLE = 'Untitled'
const LIST_TITLE_MAX_LENGTH = 40

export { formatDuration }

export function formatSessionTime(date: Date): string {
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    .toLowerCase()
}

export function formatDetailDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

export function formatSessionListTitle(session: MeetingSession): string {
  if (session.title === UNTITLED_SESSION_TITLE || AUTO_RECORDING_TITLE_PREFIX.test(session.title)) {
    return formatSessionTime(session.startedAt)
  }

  if (session.title.length <= LIST_TITLE_MAX_LENGTH) {
    return session.title
  }

  return `${session.title.slice(0, LIST_TITLE_MAX_LENGTH - 1)}…`
}

export function formatSessionListMeta(session: MeetingSession): string {
  return `${formatDuration(session.durationSeconds)} · ${formatSessionTime(session.startedAt)}`
}
