import { ipcMain } from 'electron'
import { IPC_CHANNELS, type SavedSessionTranscript, type SessionLoadResult } from '@shared/ipc'
import {
  listMeetingSessions,
  loadMeetingSession,
  saveMeetingSession
} from '../mastra/meetingRepository'
import { getElectronMemoryStore } from './mastraStorage'

export function registerSessionHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.session.save,
    async (_event, payload: SavedSessionTranscript) => {
      const memory = getElectronMemoryStore()
      const sessionId = await saveMeetingSession(memory, payload)
      return { sessionId }
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
}
