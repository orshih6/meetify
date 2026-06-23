import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'
import { formatTranscriptForSummary } from '@shared/summary/formatTranscriptForSummary'
import { meetingSummaryAgent } from '../mastra/agents/meeting-summary-agent'
import {
  getMeetingTranscriptEntries,
  loadMeetingSession,
  markSummaryError,
  saveMeetingSummary
} from '../mastra/meetingRepository'
import { getElectronMemoryStore } from './mastraStorage'
import { getOpenAiApiKey } from './credentials'

export function registerSummaryHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.summary.generate, async (_event, sessionId: string) => {
    const memory = getElectronMemoryStore()

    try {
      const session = await loadMeetingSession(memory, sessionId)

      if (!session) {
        throw new Error(`Meeting session not found: ${sessionId}`)
      }

      const transcript = await getMeetingTranscriptEntries(memory, sessionId)
      const formattedTranscript = formatTranscriptForSummary(transcript, session.startedAt)
      const prompt = `Summarize the following meeting transcript:\n\n${formattedTranscript}`
      const apiKey = await getOpenAiApiKey()
      const response = await meetingSummaryAgent.generate(prompt, {
        model: { id: 'openai/gpt-5-mini', apiKey }
      })
      const summary = response.text?.trim()

      if (!summary) {
        throw new Error('Summary agent returned empty response.')
      }

      await saveMeetingSummary(memory, sessionId, summary)

      return { summary }
    } catch (error) {
      await markSummaryError(memory, sessionId).catch(() => undefined)
      throw error
    }
  })
}
