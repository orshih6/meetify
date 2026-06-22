import {
  audioStreamCapture,
  type TranscriptSource
} from '@renderer/lib/audioStreamCapture'

type TranscriptionEvent =
  | { type: 'delta'; source: TranscriptSource; delta: string }
  | { type: 'utterance'; source: TranscriptSource; text: string }

type Unsubscribe = () => void

let unsubscribes: Unsubscribe[] = []

async function start(
  onEvent: (event: TranscriptionEvent) => void
): Promise<{ warning: string | null }> {
  unsubscribes = [
    window.api.transcription.onDelta(({ source, delta }) => {
      onEvent({ type: 'delta', source, delta })
    }),
    window.api.transcription.onUtterance(({ source, text }) => {
      onEvent({ type: 'utterance', source, text })
    }),
    window.api.transcription.onError((message) => {
      console.error('Transcription error:', message)
    }),
    window.api.transcription.onClosed(() => {
      console.warn('Transcription session closed unexpectedly.')
    })
  ]

  const { warning, sources } = await audioStreamCapture.prepare()
  await window.api.transcription.start(sources)

  audioStreamCapture.beginProcessing((source, pcm) => {
    window.api.transcription.sendAudio(source, pcm)
  })

  return { warning }
}

async function stop(): Promise<void> {
  audioStreamCapture.stop()

  for (const unsubscribe of unsubscribes) {
    unsubscribe()
  }
  unsubscribes = []

  await window.api.transcription.stop()
}

export const realtimeTranscriptionService = { start, stop }
