import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  ApiKeyStatus,
  AppSettings,
  SessionAppendTranscriptPayload,
  SessionFinalizeRecordingPayload,
  SessionFinalizeRecordingResult,
  SessionListEntry,
  SessionLoadResult,
  SummaryGenerateResult,
  TitleGenerateResult,
  TranscriptionDeltaPayload,
  TranscriptionErrorPayload,
  TranscriptionSourcePayload,
  TranscriptionStartResult,
  TranscriptionStopResult,
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
      }
      session: {
        appendTranscript: (payload: SessionAppendTranscriptPayload) => Promise<void>
        finalizeRecording: (
          payload: SessionFinalizeRecordingPayload
        ) => Promise<SessionFinalizeRecordingResult>
        list: () => Promise<SessionListEntry[]>
        load: (sessionId: string) => Promise<SessionLoadResult | null>
        delete: (sessionId: string) => Promise<void>
      }
      summary: {
        generate: (sessionId: string) => Promise<SummaryGenerateResult>
      }
      title: {
        generate: (sessionId: string) => Promise<TitleGenerateResult>
      }
      transcription: {
        start: (sources: TranscriptSource[]) => Promise<TranscriptionStartResult>
        stop: () => Promise<TranscriptionStopResult>
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
      app: {
        getVersion: () => Promise<string>
      }
      shortcut: {
        onOpenSettings: (callback: () => void) => () => void
        onStartRecording: (callback: () => void) => () => void
        onStopRecording: (callback: () => void) => () => void
      }
    }
  }
}

export {}
