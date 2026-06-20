import type { TranscriptEntry } from '@renderer/types/meeting'

export function formatTranscriptForCopy(entries: TranscriptEntry[] | undefined): string {
  if (!entries?.length) {
    return ''
  }

  return entries.map((entry) => `${entry.speaker} ${entry.time}\n${entry.text}`).join('\n\n')
}
