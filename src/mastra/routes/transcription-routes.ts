import { Readable } from 'node:stream'
import { registerApiRoute, type ContextWithMastra } from '@mastra/core/server'
import type { OpenAIVoice } from '@mastra/voice-openai'
import { TRANSCRIPTION_LANGUAGE } from '../agents/transcription-agent'

const SAMPLE_RATE = 24000
const COMMIT_INTERVAL_MS = 2000

const session = {
  voice: null as OpenAIVoice | null,
  pcm: [] as Buffer[],
  timer: null as ReturnType<typeof setInterval> | null,
  listeners: new Set<(event: { type: 'delta'; text: string }) => void>()
}

function pcmToWav(pcm: Buffer): Buffer {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(SAMPLE_RATE * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

async function flush(): Promise<void> {
  if (!session.voice || session.pcm.length === 0) {
    return
  }

  const pcm = Buffer.concat(session.pcm)
  session.pcm = []

  if (pcm.length < SAMPLE_RATE) {
    session.pcm.push(pcm)
    return
  }

  const text = (
    await session.voice.listen(Readable.from(pcmToWav(pcm)), {
      filetype: 'wav',
      language: TRANSCRIPTION_LANGUAGE
    })
  ).trim()

  if (text) {
    const event = { type: 'delta' as const, text: `${text} ` }
    for (const listener of session.listeners) {
      listener(event)
    }
  }
}

function resetSession(): void {
  if (session.timer) {
    clearInterval(session.timer)
  }

  session.voice = null
  session.pcm = []
  session.timer = null
}

export const transcriptionRoutes = [
  registerApiRoute('/transcription/start', {
    method: 'POST',
    requiresAuth: false,
    handler: async (c: ContextWithMastra) => {
      if (session.voice) {
        return c.json({ error: 'Transcription is already active.' }, 409)
      }

      const agent = c.get('mastra').getAgentById('transcription-agent')
      session.pcm = []
      session.voice = (await agent.getVoice()) as unknown as OpenAIVoice
      session.timer = setInterval(() => void flush(), COMMIT_INTERVAL_MS)

      return c.json({ ok: true })
    }
  }),
  registerApiRoute('/transcription/events', {
    method: 'GET',
    requiresAuth: false,
    handler: (c: ContextWithMastra) => {
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        start(controller) {
          const send = (event: { type: 'delta'; text: string }): void => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          }

          session.listeners.add(send)
          c.req.raw.signal.addEventListener('abort', () => {
            session.listeners.delete(send)
            controller.close()
          })
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      })
    }
  }),
  registerApiRoute('/transcription/audio', {
    method: 'POST',
    requiresAuth: false,
    handler: async (c: ContextWithMastra) => {
      if (!session.voice) {
        return c.json({ error: 'No active transcription session.' }, 400)
      }

      const body = await c.req.json<{ audio?: string }>()
      if (!body.audio) {
        return c.json({ error: 'Missing audio payload.' }, 400)
      }

      session.pcm.push(Buffer.from(body.audio, 'base64'))
      return c.json({ ok: true })
    }
  }),
  registerApiRoute('/transcription/stop', {
    method: 'POST',
    requiresAuth: false,
    handler: async (c: ContextWithMastra) => {
      if (session.voice) {
        await flush()
      }

      resetSession()
      return c.json({ ok: true })
    }
  })
]
