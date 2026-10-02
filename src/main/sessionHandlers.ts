import { ipcMain } from 'electron'
import { IPC_CHANNELS, type SessionLoadResult } from '@shared/ipc'
import {
  deleteMeetingSession,
  listMeetingSessions,
  loadMeetingSession
} from '../mastra/meetingRepository'
import { getElectronMemoryStore } from './mastraStorage'

export function registerSessionHandlers(): void {
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
