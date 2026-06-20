const PREFERRED_MIME_TYPE = 'audio/webm;codecs=opus'

type RecordingStartResult = {
  warning: string | null
}

type RecordingStopResult = {
  filePath: string
}

class RecordingService {
  private micStream: MediaStream | null = null
  private systemStream: MediaStream | null = null
  private mixedStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private mediaRecorder: MediaRecorder | null = null
  private chunks: BlobPart[] = []
  private warning: string | null = null

  async start(): Promise<RecordingStartResult> {
    if (this.mediaRecorder?.state === 'recording') {
      return { warning: this.warning }
    }

    this.warning = null
    this.chunks = []

    const micGranted = await window.api.recording.requestMicPermission()

    if (!micGranted) {
      throw new Error('Microphone permission was denied.')
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    try {
      this.systemStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      for (const track of this.systemStream.getVideoTracks()) {
        track.stop()
        this.systemStream.removeTrack(track)
      }

      if (this.systemStream.getAudioTracks().length === 0) {
        this.stopStream(this.systemStream)
        this.systemStream = null
        this.warning =
          'System audio unavailable. Recording microphone only. Grant Screen Recording permission in System Settings.'
      }
    } catch {
      this.systemStream = null
      this.warning =
        'System audio unavailable. Recording microphone only. Grant Screen Recording permission in System Settings.'
    }

    const streamsToMix = [this.micStream, this.systemStream].filter(
      (stream): stream is MediaStream => stream !== null
    )

    this.audioContext = new AudioContext()
    const destination = this.audioContext.createMediaStreamDestination()

    for (const stream of streamsToMix) {
      const source = this.audioContext.createMediaStreamSource(stream)
      source.connect(destination)
    }

    this.mixedStream = destination.stream

    const mimeType = MediaRecorder.isTypeSupported(PREFERRED_MIME_TYPE)
      ? PREFERRED_MIME_TYPE
      : 'audio/webm'

    this.mediaRecorder = new MediaRecorder(this.mixedStream, { mimeType })
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.start()

    return { warning: this.warning }
  }

  async stop(): Promise<RecordingStopResult> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      throw new Error('No active recording to stop.')
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      const recorder = this.mediaRecorder

      if (!recorder) {
        reject(new Error('No active recording to stop.'))
        return
      }

      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm'
        resolve(new Blob(this.chunks, { type }))
      }

      recorder.onerror = () => {
        reject(new Error('Recording failed.'))
      }

      recorder.stop()
    })

    this.cleanup()

    const buffer = await blob.arrayBuffer()
    const filename = `recording-${formatRecordingFilename(new Date())}.webm`
    const filePath = await window.api.recording.save(buffer, filename)

    return { filePath }
  }

  private cleanup(): void {
    this.stopStream(this.micStream)
    this.stopStream(this.systemStream)
    this.stopStream(this.mixedStream)

    this.micStream = null
    this.systemStream = null
    this.mixedStream = null
    this.mediaRecorder = null
    this.chunks = []

    if (this.audioContext) {
      void this.audioContext.close()
      this.audioContext = null
    }
  }

  private stopStream(stream: MediaStream | null): void {
    if (!stream) {
      return
    }

    for (const track of stream.getTracks()) {
      track.stop()
    }
  }
}

function formatRecordingFilename(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')

  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-') +
    `-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  )
}

export const recordingService = new RecordingService()
