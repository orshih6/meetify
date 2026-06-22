import { ElectronAPI } from '@electron-toolkit/preload'

type TranscriptSource = 'me' | 'interviewer'

type TranscriptionDeltaPayload = {
  source: TranscriptSource
  delta: string
}

type TranscriptionUtterancePayload = {
  source: TranscriptSource
  text: string
}

type TranscriptionSourcePayload = {
  source: TranscriptSource
}

type SavedTranscriptEntry = {
  speaker: string
  time: string
  text: string
  elapsedSeconds: number
}

type SavedSessionTranscript = {
  startedAt: string
  durationSeconds: number
  transcript: SavedTranscriptEntry[]
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: NodeJS.Platform
      recording: {
        requestMicPermission: () => Promise<boolean>
        save: (buffer: ArrayBuffer, filename: string) => Promise<string>
      }
      transcript: {
        save: (payload: SavedSessionTranscript, filename: string) => Promise<string>
      }
      transcription: {
        start: (sources: TranscriptSource[]) => Promise<void>
        stop: () => Promise<void>
        sendAudio: (source: TranscriptSource, pcm: Int16Array) => void
        onDelta: (callback: (payload: TranscriptionDeltaPayload) => void) => () => void
        onUtterance: (callback: (payload: TranscriptionUtterancePayload) => void) => () => void
        onUtteranceEnd: (callback: (payload: TranscriptionSourcePayload) => void) => () => void
        onError: (callback: (message: string) => void) => () => void
        onClosed: (callback: () => void) => () => void
      }
    }
  }
}

export {}
