export type SummaryStatus = 'processing' | 'ready' | 'error'

export type TranscriptSource = 'me' | 'interviewer'

export type TranscriptionDeltaPayload = {
  source: TranscriptSource
  itemId: string
  delta: string
  itemStartedAtMs?: number
}

export type TranscriptionUtterancePayload = {
  source: TranscriptSource
  itemId: string
  text: string
  itemStartedAtMs: number
}

export type TranscriptionSourcePayload = {
  source: TranscriptSource
}

export type TranscriptionErrorPayload = {
  source?: TranscriptSource
  message?: string
}

export type TranscriptionAudioPayload = {
  source: TranscriptSource
  pcm: Uint8Array
}

export type SavedTranscriptEntry = {
  speaker: string
  text: string
  itemId: string
  itemStartedAtMs: number
}

export type SessionListEntry = {
  sessionId: string
  title: string
  startedAt: string
  durationSeconds: number
  summaryStatus: SummaryStatus
}

export type SessionLoadResult = {
  sessionId: string
  title: string
  startedAt: string
  durationSeconds: number
  transcript: SavedTranscriptEntry[]
  summary?: string
  summaryStatus?: SummaryStatus
}

export type TranscriptionStartResult = {
  sessionId: string
  startedAtMs: number
}

export type TranscriptionStopResult = {
  sessionId: string | null
}

export type SummaryGenerateResult = {
  summary: string
}

export type TitleGenerateResult = {
  title: string
}
