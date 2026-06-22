import { Agent } from '@mastra/core/agent'
import type { MastraVoice } from '@mastra/core/voice'
import { Memory } from '@mastra/memory'
import { OpenAIVoice } from '@mastra/voice-openai'

export const TRANSCRIPTION_LANGUAGE = 'en'

export const transcriptionAgent = new Agent({
  id: 'transcription-agent',
  name: 'Transcription Agent',
  instructions: 'Transcribe user speech to text only.',
  model: 'gpt-4o-transcribe',
  memory: new Memory(),
  voice: () =>
    new OpenAIVoice({
      listeningModel: {
        name: 'whisper-1'
      }
    }) as unknown as MastraVoice
})
