const TARGET_SAMPLE_RATE = 24000

export const SYSTEM_AUDIO_WARNING =
  'System audio unavailable — recording microphone only. Grant System Audio Recording permission (built app) or check Audio settings.'

let streams: MediaStream[] = []
let audioContext: AudioContext | null = null
let processor: ScriptProcessorNode | null = null
let silentGain: GainNode | null = null

async function captureMic(): Promise<MediaStream> {
  const granted = await window.api.recording.requestMicPermission()

  if (!granted) {
    throw new Error('Microphone permission was denied.')
  }

  return navigator.mediaDevices.getUserMedia({ audio: true })
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

function mixStreams(inputs: MediaStream[], context: AudioContext): MediaStream {
  const destination = context.createMediaStreamDestination()

  for (const stream of inputs) {
    context.createMediaStreamSource(stream).connect(destination)
  }

  return destination.stream
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
  processor?.disconnect()
  silentGain?.disconnect()
  processor = null
  silentGain = null

  stopTracks(streams)
  streams = []

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}

async function start(onChunk: (pcm: Int16Array) => void): Promise<{ warning: string | null }> {
  resetState()

  const mic = await captureMic()
  const { stream: system, warning } = await captureSystemAudio()

  streams = [mic, ...(system ? [system] : [])]

  audioContext = new AudioContext()
  const mixed = mixStreams(streams, audioContext)
  const source = audioContext.createMediaStreamSource(mixed)

  processor = audioContext.createScriptProcessor(4096, 1, 1)
  processor.onaudioprocess = (event) => {
    const channel = event.inputBuffer.getChannelData(0)
    const resampled = resample(channel, audioContext!.sampleRate, TARGET_SAMPLE_RATE)
    onChunk(floatTo16BitPcm(resampled))
  }

  silentGain = audioContext.createGain()
  silentGain.gain.value = 0

  source.connect(processor)
  processor.connect(silentGain)
  silentGain.connect(audioContext.destination)

  return { warning }
}

function stop(): void {
  resetState()
}

export const audioStreamCapture = { start, stop }
