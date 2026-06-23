import type { SavedTranscriptEntry, TranscriptSource } from '@shared/ipc'

export const SOURCE_LABELS: Record<TranscriptSource, string> = {
  me: 'Me',
  interviewer: 'Them'
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function formatEntryTime(
  itemStartedAtMs: number,
  recordingStartedAtMs: number
): string {
  const offsetSeconds = Math.max(0, Math.floor((itemStartedAtMs - recordingStartedAtMs) / 1000))
  return formatDuration(offsetSeconds)
}

export function buildTranscriptEntry({
  source,
  text,
  itemId,
  itemStartedAtMs
}: {
  source: TranscriptSource
  text: string
  itemId: string
  itemStartedAtMs: number
}): SavedTranscriptEntry {
  return {
    speaker: SOURCE_LABELS[source],
    text: text.trim(),
    itemId,
    itemStartedAtMs
  }
}
