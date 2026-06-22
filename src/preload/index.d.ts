import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: NodeJS.Platform
      recording: {
        requestMicPermission: () => Promise<boolean>
        save: (buffer: ArrayBuffer, filename: string) => Promise<string>
      }
      transcription: {
        start: () => Promise<void>
        stop: () => Promise<void>
        sendAudio: (pcm: Int16Array) => void
        onDelta: (callback: (delta: string) => void) => () => void
        onError: (callback: (message: string) => void) => () => void
        onClosed: (callback: () => void) => () => void
      }
    }
  }
}
