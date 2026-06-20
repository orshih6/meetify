const MIME_TYPE = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ? 'audio/webm;codecs=opus'
  : 'audio/webm'

const SYSTEM_AUDIO_WARNING =
  'System audio unavailable — recording microphone only. Grant System Audio Recording permission (built app) or check Audio settings.'

let streams: MediaStream[] = []
let audioContext: AudioContext | null = null
let recorder: MediaRecorder | null = null
let chunks: BlobPart[] = []
let lastWarning: string | null = null

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

function mixStreams(inputs: MediaStream[]): MediaStream {
  audioContext = new AudioContext()
  const destination = audioContext.createMediaStreamDestination()

  for (const stream of inputs) {
    audioContext.createMediaStreamSource(stream).connect(destination)
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

function resetState(): void {
  stopTracks(streams)
  streams = []
  chunks = []
  recorder = null
  lastWarning = null

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}

function waitForBlob(mediaRecorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' }))
    }

    mediaRecorder.onerror = () => {
      reject(new Error('Recording failed.'))
    }

    mediaRecorder.stop()
  })
}

function makeFilename(): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  const now = new Date()

  return `recording-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.webm`
}

async function start(): Promise<{ warning: string | null }> {
  if (recorder?.state === 'recording') {
    return { warning: lastWarning }
  }

  resetState()

  const mic = await captureMic()
  const { stream: system, warning } = await captureSystemAudio()

  streams = [mic, ...(system ? [system] : [])]
  lastWarning = warning

  const mixed = mixStreams(streams)
  recorder = new MediaRecorder(mixed, { mimeType: MIME_TYPE })
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data)
    }
  }
  recorder.start()

  return { warning }
}

async function stop(): Promise<{ filePath: string }> {
  if (!recorder || recorder.state === 'inactive') {
    throw new Error('No active recording to stop.')
  }

  const blob = await waitForBlob(recorder)
  resetState()

  const filePath = await window.api.recording.save(await blob.arrayBuffer(), makeFilename())
  return { filePath }
}

export const recordingService = { start, stop }
