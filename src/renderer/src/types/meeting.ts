export type { SavedSessionTranscript, SavedTranscriptEntry, TranscriptSource } from '@shared/ipc'
export type { SummaryStatus } from '@shared/ipc'

export type TranscriptEntry = {
  speaker: string
  time: string
  text: string
}

export type MeetingSession = {
  id: string
  title: string
  startedAt: Date
  durationSeconds: number
  summary?: string
  summaryStatus?: 'processing' | 'ready' | 'error'
  transcript?: TranscriptEntry[]
}
