import type { SavedTranscriptEntry } from '@shared/ipc'

export function formatTranscriptForSummary(transcript: SavedTranscriptEntry[]): string {
  if (transcript.length === 0) {
    return 'No transcript content.'
  }

  return transcript
    .toSorted((a, b) => a.elapsedSeconds - b.elapsedSeconds)
    .map((entry) => `${entry.speaker} (${entry.time}): ${entry.text}`)
    .join('\n')
}
