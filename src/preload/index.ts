import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '@shared/ipc'
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

function onTranscriptionDelta(callback: (payload: TranscriptionDeltaPayload) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: TranscriptionDeltaPayload): void => {
    callback(payload)
  }

  ipcRenderer.on(IPC_CHANNELS.transcription.delta, handler)

  return () => {
    ipcRenderer.removeListener(IPC_CHANNELS.transcription.delta, handler)
  }
}

function onTranscriptionUtterance(
  callback: (payload: TranscriptionUtterancePayload) => void
): () => void {
  const handler = (_event: IpcRendererEvent, payload: TranscriptionUtterancePayload): void => {
    callback(payload)
  }

  ipcRenderer.on(IPC_CHANNELS.transcription.utterance, handler)

  return () => {
    ipcRenderer.removeListener(IPC_CHANNELS.transcription.utterance, handler)
  }
}

function onTranscriptionError(callback: (payload: TranscriptionErrorPayload) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: TranscriptionErrorPayload): void => {
    callback(payload)
  }

  ipcRenderer.on(IPC_CHANNELS.transcription.error, handler)

  return () => {
    ipcRenderer.removeListener(IPC_CHANNELS.transcription.error, handler)
  }
}

function onTranscriptionClosed(
  callback: (payload: TranscriptionSourcePayload) => void
): () => void {
  const handler = (_event: IpcRendererEvent, payload: TranscriptionSourcePayload): void => {
    callback(payload)
  }

  ipcRenderer.on(IPC_CHANNELS.transcription.closed, handler)

  return () => {
    ipcRenderer.removeListener(IPC_CHANNELS.transcription.closed, handler)
  }
}

function onShortcut(channel: string, callback: () => void): () => void {
  const handler = (): void => {
    callback()
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
      ipcRenderer.invoke(IPC_CHANNELS.recording.requestMicPermission)
  },
  session: {
    appendTranscript: (payload: SessionAppendTranscriptPayload): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.session.appendTranscript, payload),
    finalizeRecording: (
      payload: SessionFinalizeRecordingPayload
    ): Promise<SessionFinalizeRecordingResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.session.finalizeRecording, payload),
    list: (): Promise<SessionListEntry[]> => ipcRenderer.invoke(IPC_CHANNELS.session.list),
    load: (sessionId: string): Promise<SessionLoadResult | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.session.load, sessionId),
    delete: (sessionId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.session.delete, sessionId)
  },
  summary: {
    generate: (sessionId: string): Promise<SummaryGenerateResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.summary.generate, sessionId)
  },
  title: {
    generate: (sessionId: string): Promise<TitleGenerateResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.title.generate, sessionId)
  },
  transcription: {
    start: (sources: TranscriptSource[]): Promise<TranscriptionStartResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.transcription.start, sources),
    stop: (): Promise<TranscriptionStopResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.transcription.stop),
    sendAudio: (source: TranscriptSource, pcm: Int16Array): void =>
      ipcRenderer.send(IPC_CHANNELS.transcription.audio, { source, pcm }),
    onDelta: (callback: (payload: TranscriptionDeltaPayload) => void): (() => void) =>
      onTranscriptionDelta(callback),
    onUtterance: (callback: (payload: TranscriptionUtterancePayload) => void): (() => void) =>
      onTranscriptionUtterance(callback),
    onError: (callback: (payload: TranscriptionErrorPayload) => void): (() => void) =>
      onTranscriptionError(callback),
    onClosed: (callback: (payload: TranscriptionSourcePayload) => void): (() => void) =>
      onTranscriptionClosed(callback)
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_CHANNELS.settings.get),
    set: (partial: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.settings.set, partial)
  },
  credentials: {
    getStatus: (): Promise<ApiKeyStatus> => ipcRenderer.invoke(IPC_CHANNELS.credentials.getStatus),
    setOpenAiApiKey: (apiKey: string): Promise<ApiKeyStatus> =>
      ipcRenderer.invoke(IPC_CHANNELS.credentials.setOpenAiApiKey, apiKey),
    clearOpenAiApiKey: (): Promise<ApiKeyStatus> =>
      ipcRenderer.invoke(IPC_CHANNELS.credentials.clearOpenAiApiKey)
  },
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.app.getVersion)
  },
  shortcut: {
    onOpenSettings: (callback: () => void): (() => void) =>
      onShortcut(IPC_CHANNELS.shortcut.openSettings, callback),
    onStartRecording: (callback: () => void): (() => void) =>
      onShortcut(IPC_CHANNELS.shortcut.startRecording, callback),
    onStopRecording: (callback: () => void): (() => void) =>
      onShortcut(IPC_CHANNELS.shortcut.stopRecording, callback)
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
