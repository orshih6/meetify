import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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

type TranscriptionErrorPayload = {
  source?: TranscriptSource
  message?: string
}

function onTranscriptionDelta(
  callback: (payload: TranscriptionDeltaPayload) => void
): () => void {
  const handler = (_event: IpcRendererEvent, payload: TranscriptionDeltaPayload): void => {
    callback(payload)
  }

  ipcRenderer.on('transcription:delta', handler)

  return () => {
    ipcRenderer.removeListener('transcription:delta', handler)
  }
}

function onTranscriptionUtterance(
  callback: (payload: TranscriptionUtterancePayload) => void
): () => void {
  const handler = (_event: IpcRendererEvent, payload: TranscriptionUtterancePayload): void => {
    callback(payload)
  }

  ipcRenderer.on('transcription:utterance', handler)

  return () => {
    ipcRenderer.removeListener('transcription:utterance', handler)
  }
}

function onTranscriptionUtteranceEnd(
  callback: (payload: TranscriptionSourcePayload) => void
): () => void {
  const handler = (_event: IpcRendererEvent, payload: TranscriptionSourcePayload): void => {
    callback(payload)
  }

  ipcRenderer.on('transcription:utterance-end', handler)

  return () => {
    ipcRenderer.removeListener('transcription:utterance-end', handler)
  }
}

function onTranscriptionError(callback: (message: string) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: TranscriptionErrorPayload): void => {
    if (payload.message) {
      callback(payload.message)
    }
  }

  ipcRenderer.on('transcription:error', handler)

  return () => {
    ipcRenderer.removeListener('transcription:error', handler)
  }
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

const api = {
  platform: process.platform,
  recording: {
    requestMicPermission: (): Promise<boolean> =>
      ipcRenderer.invoke('recording:request-mic-permission'),
    save: (buffer: ArrayBuffer, filename: string): Promise<string> =>
      ipcRenderer.invoke('recording:save', new Uint8Array(buffer), filename)
  },
  transcript: {
    save: (payload: SavedSessionTranscript, filename: string): Promise<string> =>
      ipcRenderer.invoke('transcript:save', payload, filename)
  },
  transcription: {
    start: (sources: TranscriptSource[]): Promise<void> =>
      ipcRenderer.invoke('transcription:start', sources),
    stop: (): Promise<void> => ipcRenderer.invoke('transcription:stop'),
    sendAudio: (source: TranscriptSource, pcm: Int16Array): void =>
      ipcRenderer.send('transcription:audio', { source, pcm }),
    onDelta: (callback: (payload: TranscriptionDeltaPayload) => void): (() => void) =>
      onTranscriptionDelta(callback),
    onUtterance: (callback: (payload: TranscriptionUtterancePayload) => void): (() => void) =>
      onTranscriptionUtterance(callback),
    onUtteranceEnd: (callback: (payload: TranscriptionSourcePayload) => void): (() => void) =>
      onTranscriptionUtteranceEnd(callback),
    onError: (callback: (message: string) => void): (() => void) =>
      onTranscriptionError(callback),
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
