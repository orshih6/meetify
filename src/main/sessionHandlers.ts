import { ipcMain } from 'electron'
import {
  IPC_CHANNELS,
  type SessionAppendTranscriptPayload,
  type SessionFinalizeRecordingPayload,
  type SessionLoadResult
} from '@shared/ipc'
import {
  appendTranscriptEntry,
  deleteMeetingSession,
  finalizeRecordingSession,
  listMeetingSessions,
  loadMeetingSession
} from '../mastra/meetingRepository'
import { getElectronMemoryStore } from './mastraStorage'

export function registerSessionHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.session.appendTranscript,
    async (_event, payload: SessionAppendTranscriptPayload) => {
      const memory = getElectronMemoryStore()
      const session = await loadMeetingSession(memory, payload.sessionId)

      if (!session) {
        throw new Error(`Meeting session not found: ${payload.sessionId}`)
      }

      await appendTranscriptEntry(memory, payload.sessionId, payload.entry, session.startedAt)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.session.finalizeRecording,
    async (_event, payload: SessionFinalizeRecordingPayload) => {
      const memory = getElectronMemoryStore()
      const result = await finalizeRecordingSession(memory, payload.sessionId, payload.stoppedAt)

      return {
        sessionId: payload.sessionId,
        durationSeconds: result.durationSeconds,
        entryCount: result.entryCount
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.session.list, async () => {
    const memory = getElectronMemoryStore()
    return listMeetingSessions(memory)
  })

  ipcMain.handle(
    IPC_CHANNELS.session.load,
    async (_event, sessionId: string): Promise<SessionLoadResult | null> => {
      const memory = getElectronMemoryStore()
      return loadMeetingSession(memory, sessionId)
    }
  )

  ipcMain.handle(IPC_CHANNELS.session.delete, async (_event, sessionId: string) => {
    const memory = getElectronMemoryStore()
    await deleteMeetingSession(memory, sessionId)
  })
}
