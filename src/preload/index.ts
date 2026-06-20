import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  platform: process.platform,
  recording: {
    requestMicPermission: (): Promise<boolean> =>
      ipcRenderer.invoke('recording:request-mic-permission'),
    save: (buffer: ArrayBuffer, filename: string): Promise<string> =>
      ipcRenderer.invoke('recording:save', new Uint8Array(buffer), filename)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
