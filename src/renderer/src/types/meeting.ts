export type TranscriptEntry = {
  speaker: string
  time: string
  text: string
}

export type SavedTranscriptEntry = TranscriptEntry & {
  elapsedSeconds: number
}

export type SavedSessionTranscript = {
  startedAt: string
  durationSeconds: number
  transcript: SavedTranscriptEntry[]
}

export type MeetingSession = {
  id: string
  title: string
  startedAt: Date
  durationSeconds: number
  summary?: string
  transcript?: TranscriptEntry[]
}
