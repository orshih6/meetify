import { audioStreamCapture } from '@renderer/lib/audioStreamCapture'

const MASTRA_BASE = 'http://localhost:4111'

type TranscriptEvent = {
  type: 'delta'
  text: string
}

let eventSource: EventSource | null = null

function int16ToBase64(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength)
  let binary = ''

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
}

async function postAudio(pcm: Int16Array): Promise<void> {
  await fetch(`${MASTRA_BASE}/transcription/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: int16ToBase64(pcm) })
  })
}

async function start(onDelta: (text: string) => void): Promise<{ warning: string | null }> {
  eventSource = new EventSource(`${MASTRA_BASE}/transcription/events`)

  eventSource.onmessage = (message) => {
    const event = JSON.parse(message.data) as TranscriptEvent

    if (event.type === 'delta') {
      onDelta(event.text)
    }
  }

  const startResponse = await fetch(`${MASTRA_BASE}/transcription/start`, { method: 'POST' })

  if (!startResponse.ok) {
    eventSource.close()
    eventSource = null
    throw new Error('Failed to start transcription.')
  }

  const { warning } = await audioStreamCapture.start((pcm) => {
    void postAudio(pcm)
  })

  return { warning }
}

async function stop(): Promise<void> {
  audioStreamCapture.stop()

  if (eventSource) {
    eventSource.close()
    eventSource = null
  }

  await fetch(`${MASTRA_BASE}/transcription/stop`, { method: 'POST' })
}

export const realtimeTranscriptionService = { start, stop }
