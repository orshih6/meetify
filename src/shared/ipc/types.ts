export type TranscriptSource = 'me' | 'interviewer'

export type TranscriptionDeltaPayload = {
  source: TranscriptSource
  itemId: string
  contentIndex?: number
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

export type SavedSessionTranscript = {
  startedAt: string
  durationSeconds: number
  transcript: SavedTranscriptEntry[]
}

export type SummaryStatus = 'processing' | 'ready' | 'error'

export type SessionStatus = 'recording' | 'completed'

export type SessionAppendTranscriptPayload = {
  sessionId: string
  entry: SavedTranscriptEntry
}

export type SessionFinalizeRecordingPayload = {
  sessionId: string
  stoppedAt: number
}

export type SessionFinalizeRecordingResult = {
  sessionId: string
  durationSeconds: number
  entryCount: number
}

export type TranscriptionStartResult = {
  sessionId: string
}

export type TranscriptionStopResult = {
  sessionId: string | null
  entryCount: number
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
  inputDeviceId: string | null
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  speechProvider: 'openai-realtime',
  language: 'en',
  inputDeviceId: null
}
