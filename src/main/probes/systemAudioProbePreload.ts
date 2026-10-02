import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

const PROBE_CHANNELS = {
  pcm: 'probe:pcm',
  transcript: 'probe:transcript'
} as const

export type ProbeTranscriptEvent =
  | { type: 'ready'; eventType: string }
  | { type: 'delta'; delta: string }
  | { type: 'utterance'; text: string; itemId: string }
  | { type: 'error'; message: string }

contextBridge.exposeInMainWorld('probe', {
  sendPcm: (pcm: ArrayBuffer): void => {
    ipcRenderer.send(PROBE_CHANNELS.pcm, pcm)
  },
  onTranscript: (callback: (event: ProbeTranscriptEvent) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: ProbeTranscriptEvent): void => {
      callback(payload)
    }

    ipcRenderer.on(PROBE_CHANNELS.transcript, handler)

    return () => {
      ipcRenderer.removeListener(PROBE_CHANNELS.transcript, handler)
    }
  }
})
