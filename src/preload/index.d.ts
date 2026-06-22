import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  AppSettings,
  SavedSessionTranscript,
  TranscriptListEntry,
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
      transcript: {
        save: (payload: SavedSessionTranscript, filename: string) => Promise<string>
        list: () => Promise<TranscriptListEntry[]>
        load: (filename: string) => Promise<SavedSessionTranscript | null>
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
    }
  }
}

export {}
