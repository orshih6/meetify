import OpenAI from 'openai'
import WebSocket from 'ws'

export const TRANSCRIPTION_MODEL = 'gpt-realtime-whisper'

export type TranscriptionServerEvent = {
  type: string
  delta?: string
  transcript?: string
  error?: { message?: string }
}

export function buildTranscriptionUrl(apiKey: string): URL {
  const baseURL = new OpenAI({ apiKey }).baseURL
  const path = '/realtime'
  const url = new URL(baseURL + (baseURL.endsWith('/') ? path.slice(1) : path))
  url.protocol = 'wss'
  url.searchParams.set('intent', 'transcription')
  return url
}

export function buildSessionUpdateEvent(language?: string): {
  type: 'session.update'
  session: {
    type: 'transcription'
    audio: {
      input: {
        format: { type: 'audio/pcm'; rate: 24_000 }
        transcription: { model: string; language: string }
        turn_detection: null
      }
    }
  }
} {
  return {
    type: 'session.update',
    session: {
      type: 'transcription',
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24_000 },
          transcription: {
            model: TRANSCRIPTION_MODEL,
            language: language ?? process.env.TRANSCRIPTION_LANGUAGE ?? 'en'
          },
          turn_detection: null
        }
      }
    }
  }
}

export function parseServerEvent(raw: WebSocket.RawData): TranscriptionServerEvent {
  return JSON.parse(raw.toString()) as TranscriptionServerEvent
}

export function isSessionReadyEvent(type: string): boolean {
  return type === 'session.updated' || type === 'transcription_session.updated'
}

export function connectTranscriptionWebSocket(apiKey: string): WebSocket {
  const url = buildTranscriptionUrl(apiKey)
  return new WebSocket(url, { headers: { Authorization: `Bearer ${apiKey}` } })
}

export function toPcmBuffer(pcm: Uint8Array): Buffer {
  if (Buffer.isBuffer(pcm)) {
    return pcm
  }

  if (ArrayBuffer.isView(pcm)) {
    return Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength)
  }

  return Buffer.from(pcm)
}

export function appendAudioChunk(ws: WebSocket, pcm: Uint8Array): void {
  ws.send(
    JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: toPcmBuffer(pcm).toString('base64')
    })
  )
}

export function commitAudioBuffer(ws: WebSocket): void {
  ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
}
