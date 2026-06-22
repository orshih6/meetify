import { audioStreamCapture } from '@renderer/lib/audioStreamCapture'

type Unsubscribe = () => void

let deltaUnsubscribe: Unsubscribe | null = null
let errorUnsubscribe: Unsubscribe | null = null
let closedUnsubscribe: Unsubscribe | null = null

async function start(onDelta: (text: string) => void): Promise<{ warning: string | null }> {
  deltaUnsubscribe = window.api.transcription.onDelta((delta) => {
    onDelta(delta)
  })

  errorUnsubscribe = window.api.transcription.onError((message) => {
    console.error('Transcription error:', message)
  })

  closedUnsubscribe = window.api.transcription.onClosed(() => {
    console.warn('Transcription session closed unexpectedly.')
  })

  await window.api.transcription.start()

  const { warning } = await audioStreamCapture.start((pcm) => {
    window.api.transcription.sendAudio(pcm)
  })

  return { warning }
}

async function stop(): Promise<void> {
  audioStreamCapture.stop()

  deltaUnsubscribe?.()
  errorUnsubscribe?.()
  closedUnsubscribe?.()
  deltaUnsubscribe = null
  errorUnsubscribe = null
  closedUnsubscribe = null

  await window.api.transcription.stop()
}

export const realtimeTranscriptionService = { start, stop }
