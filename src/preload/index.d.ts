import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  ApiKeyStatus,
  AppSettings,
  SavedSessionTranscript,
  SessionListEntry,
  SessionLoadResult,
  SessionSaveResult,
  SummaryGenerateResult,
  TranscriptionDeltaPayload,
  TranscriptionErrorPayload,
  TranscriptionSourcePayload,
  TranscriptionUtterancePayload,
  TranscriptSource
} from '@shared/ipc'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: NodeJS.Platform
      recording: {
        requestMicPermission: () => Promise<boolean>
        save: (buffer: ArrayBuffer, filename: string) => Promise<string>
      }
      session: {
        save: (payload: SavedSessionTranscript) => Promise<SessionSaveResult>
        list: () => Promise<SessionListEntry[]>
        load: (sessionId: string) => Promise<SessionLoadResult | null>
      }
      summary: {
        generate: (sessionId: string) => Promise<SummaryGenerateResult>
      }
      transcription: {
        start: (sources: TranscriptSource[]) => Promise<void>
        stop: () => Promise<void>
        sendAudio: (source: TranscriptSource, pcm: Int16Array) => void
        onDelta: (callback: (payload: TranscriptionDeltaPayload) => void) => () => void
        onUtterance: (callback: (payload: TranscriptionUtterancePayload) => void) => () => void
        onError: (callback: (payload: TranscriptionErrorPayload) => void) => () => void
        onClosed: (callback: (payload: TranscriptionSourcePayload) => void) => () => void
      }
      settings: {
        get: () => Promise<AppSettings>
        set: (partial: Partial<AppSettings>) => Promise<AppSettings>
      }
      credentials: {
        getStatus: () => Promise<ApiKeyStatus>
        setOpenAiApiKey: (apiKey: string) => Promise<ApiKeyStatus>
        clearOpenAiApiKey: () => Promise<ApiKeyStatus>
      }
    }
  }
}

export {}
