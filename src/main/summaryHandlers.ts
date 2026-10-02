import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'
import { meetingSummaryAgent } from '../mastra/agents/meeting-summary-agent'
import { markSummaryError, saveMeetingSummary } from '../mastra/meetingRepository'
import { generateFromTranscript } from './aiSessionHandlers'
import { getElectronMemoryStore } from './mastraStorage'

export function registerSummaryHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.summary.generate, async (_event, sessionId: string) => {
    const memory = getElectronMemoryStore()

    try {
      const summary = await generateFromTranscript(
        memory,
        sessionId,
        'Summarize the following meeting transcript:',
        meetingSummaryAgent,
        saveMeetingSummary
      )

      return { summary }
    } catch (error) {
      await markSummaryError(memory, sessionId).catch(() => undefined)
      throw error
    }
  })
}
