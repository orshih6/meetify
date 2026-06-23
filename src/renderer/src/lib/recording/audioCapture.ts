import type { TranscriptSource } from '@shared/ipc'
import type { RecordingApi } from '@renderer/lib/recording/ipcAdapter'

const TARGET_SAMPLE_RATE = 24000

export const SYSTEM_AUDIO_WARNING =
  'System audio unavailable — recording microphone only. Grant System Audio Recording permission (built app) or check Audio settings.'

type CaptureSession = {
  mic: MediaStream
  system: MediaStream | null
  sources: TranscriptSource[]
  warning: string | null
}

let session: CaptureSession | null = null
let audioContext: AudioContext | null = null
let processors: ScriptProcessorNode[] = []
let silentGain: GainNode | null = null

async function captureMic(deviceId: string | null): Promise<MediaStream> {
  const audio = deviceId ? { deviceId: { exact: deviceId } } : true
  return navigator.mediaDevices.getUserMedia({ audio })
}

function hasLiveAudio(stream: MediaStream): boolean {
  return stream.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled)
}

async function captureSystemAudio(): Promise<{
  stream: MediaStream | null
  warning: string | null
}> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })

    for (const track of stream.getVideoTracks()) {
      track.enabled = false
    }

    if (!hasLiveAudio(stream)) {
      stopTracks([stream])
      return { stream: null, warning: SYSTEM_AUDIO_WARNING }
    }

    return { stream, warning: null }
  } catch {
    return { stream: null, warning: SYSTEM_AUDIO_WARNING }
  }
}

function attachPcmProcessor(
  stream: MediaStream,
  source: TranscriptSource,
  context: AudioContext,
  gain: GainNode,
  onChunk: (source: TranscriptSource, pcm: Int16Array) => void
): ScriptProcessorNode {
  const streamSource = context.createMediaStreamSource(stream)
  const processor = context.createScriptProcessor(4096, 1, 1)

  processor.onaudioprocess = (event) => {
    const channel = event.inputBuffer.getChannelData(0)
    const resampled = resample(channel, context.sampleRate, TARGET_SAMPLE_RATE)
    onChunk(source, floatTo16BitPcm(resampled))
  }

  streamSource.connect(processor)
  processor.connect(gain)

  return processor
}

function stopTracks(targets: MediaStream[]): void {
  for (const stream of targets) {
    for (const track of stream.getTracks()) {
      track.stop()
    }
  }
}

function resample(input: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (inputRate === outputRate) {
    return input
  }

  const ratio = inputRate / outputRate
  const outputLength = Math.floor(input.length / ratio)
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const sourceIndex = i * ratio
    const lower = Math.floor(sourceIndex)
    const upper = Math.min(lower + 1, input.length - 1)
    const weight = sourceIndex - lower
    output[i] = input[lower] * (1 - weight) + input[upper] * weight
  }

  return output
}

function floatTo16BitPcm(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)

  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i]))
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }

  return output
}

function resetState(): void {
  for (const processor of processors) {
    processor.disconnect()
  }

  processors = []
  silentGain?.disconnect()
  silentGain = null

  if (session) {
    stopTracks([session.mic, ...(session.system ? [session.system] : [])])
    session = null
  }

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}

export function createAudioCapture(api: RecordingApi) {
  return {
    async prepare(): Promise<{ warning: string | null; sources: TranscriptSource[] }> {
      resetState()

      const granted = await api.recording.requestMicPermission()

      if (!granted) {
        throw new Error('Microphone permission was denied.')
      }

      const settings = await api.settings.get()
      const [mic, { stream: system, warning }] = await Promise.all([
        captureMic(settings.inputDeviceId),
        captureSystemAudio()
      ])
      const sources: TranscriptSource[] = ['me', ...(system ? ['interviewer' as const] : [])]

      session = { mic, system, sources, warning }

      return { warning, sources }
    },

    beginProcessing(onChunk: (source: TranscriptSource, pcm: Int16Array) => void): void {
      if (!session) {
        throw new Error('Audio capture is not prepared.')
      }

      audioContext = new AudioContext()
      silentGain = audioContext.createGain()
      silentGain.gain.value = 0
      silentGain.connect(audioContext.destination)

      processors.push(attachPcmProcessor(session.mic, 'me', audioContext, silentGain, onChunk))

      if (session.system) {
        processors.push(
          attachPcmProcessor(session.system, 'interviewer', audioContext, silentGain, onChunk)
        )
      }
    },

    stop(): void {
      resetState()
    }
  }
}
