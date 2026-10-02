import type { MemoryStorage } from '@mastra/core/storage'
import { formatTranscriptForSummary } from '@shared/summary/formatTranscriptForSummary'
import { loadMeetingSession } from '../mastra/meetingRepository'
import { getOpenAiApiKey } from './credentials'

type TranscriptAgent = {
  generate: (
    prompt: string,
    options: { model: { id: string; apiKey: string } }
  ) => Promise<{ text?: string | null }>
}

export async function generateFromTranscript(
  memory: MemoryStorage,
  sessionId: string,
  promptPrefix: string,
  agent: TranscriptAgent,
  save: (memory: MemoryStorage, sessionId: string, result: string) => Promise<void>
): Promise<string> {
  const session = await loadMeetingSession(memory, sessionId)

  if (!session) {
    throw new Error(`Meeting session not found: ${sessionId}`)
  }

  const formattedTranscript = formatTranscriptForSummary(session.transcript, session.startedAt)
  const prompt = `${promptPrefix}\n\n${formattedTranscript}`
  const apiKey = await getOpenAiApiKey()
  const response = await agent.generate(prompt, {
    model: { id: 'openai/gpt-5-mini', apiKey }
  })
  const result = response.text?.trim()

  if (!result) {
    throw new Error('Agent returned empty response.')
  }

  await save(memory, sessionId, result)

  return result
}
