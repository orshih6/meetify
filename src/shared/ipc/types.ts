export type TranscriptSource = 'me' | 'interviewer'

export type TranscriptionDeltaPayload = {
  source: TranscriptSource
  delta: string
}

export type TranscriptionUtterancePayload = {
  source: TranscriptSource
  text: string
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
  time: string
  text: string
  elapsedSeconds: number
}

export type SavedSessionTranscript = {
  startedAt: string
  durationSeconds: number
  transcript: SavedTranscriptEntry[]
}

export type SummaryStatus = 'processing' | 'ready' | 'error'

export type SessionSaveResult = {
  sessionId: string
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

export type SummaryGenerateResult = {
  summary: string
}

export type TitleGenerateResult = {
  title: string
}

export type ApiKeyStatus = {
  configured: boolean
  source: 'settings' | 'env' | 'none'
}

export type AppSettings = {
  speechProvider: 'openai-realtime'
  language: string
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  speechProvider: 'openai-realtime',
  language: 'en'
}
