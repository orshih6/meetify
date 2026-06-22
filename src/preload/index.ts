import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type TranscriptionListener = (payload: string) => void

function onTranscriptionEvent(
  channel: string,
  callback: TranscriptionListener
): () => void {
  const handler = (_event: IpcRendererEvent, payload: { delta?: string; message?: string }) => {
    const value = payload.delta ?? payload.message

    if (value) {
      callback(value)
    }
  }

  ipcRenderer.on(channel, handler)

  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

const api = {
  platform: process.platform,
  recording: {
    requestMicPermission: (): Promise<boolean> =>
      ipcRenderer.invoke('recording:request-mic-permission'),
    save: (buffer: ArrayBuffer, filename: string): Promise<string> =>
      ipcRenderer.invoke('recording:save', new Uint8Array(buffer), filename)
  },
  transcription: {
    start: (): Promise<void> => ipcRenderer.invoke('transcription:start'),
    stop: (): Promise<void> => ipcRenderer.invoke('transcription:stop'),
    sendAudio: (pcm: Int16Array): void => ipcRenderer.send('transcription:audio', pcm),
    onDelta: (callback: (delta: string) => void): (() => void) =>
      onTranscriptionEvent('transcription:delta', callback),
    onError: (callback: (message: string) => void): (() => void) =>
      onTranscriptionEvent('transcription:error', callback),
    onClosed: (callback: () => void): (() => void) => {
      const handler = (): void => {
        callback()
      }

      ipcRenderer.on('transcription:closed', handler)

      return () => {
        ipcRenderer.removeListener('transcription:closed', handler)
      }
    }
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
