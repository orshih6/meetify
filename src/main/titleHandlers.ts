import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'
import { meetingTitleAgent } from '../mastra/agents/meeting-title-agent'
import { normalizeGeneratedTitle, saveMeetingTitle } from '../mastra/meetingRepository'
import { generateFromTranscript } from './aiSessionHandlers'
import { getElectronMemoryStore } from './mastraStorage'

export function registerTitleHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.title.generate, async (_event, sessionId: string) => {
    const memory = getElectronMemoryStore()

    const rawTitle = await generateFromTranscript(
      memory,
      sessionId,
      'Generate a short meeting title for the following transcript:',
      meetingTitleAgent,
      async (store, id, result) => saveMeetingTitle(store, id, normalizeGeneratedTitle(result))
    )

    return { title: normalizeGeneratedTitle(rawTitle) }
  })
}
