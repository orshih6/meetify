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
    }
  }
}
