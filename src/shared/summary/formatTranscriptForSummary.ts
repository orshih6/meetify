import type { SavedTranscriptEntry } from '@shared/ipc'
import { formatEntryTime } from '@shared/transcript'

export function formatTranscriptForSummary(
  transcript: SavedTranscriptEntry[],
  recordingStartedAt: string
): string {
  if (transcript.length === 0) {
    return 'No transcript content.'
  }

  const recordingStartedAtMs = new Date(recordingStartedAt).getTime()

  return transcript
    .toSorted((a, b) => a.itemStartedAtMs - b.itemStartedAtMs)
    .map((entry) => {
      const time = formatEntryTime(entry.itemStartedAtMs, recordingStartedAtMs)
      return `${entry.speaker} (${time}): ${entry.text}`
    })
    .join('\n')
}
