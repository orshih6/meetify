import { Button } from '@headlessui/react'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/16/solid'
import { formatDuration } from '@renderer/lib/format'
import {
  controlFocus,
  recordButtonIdle,
  recordButtonLive,
  surfaceBorder,
  surfaceMuted
} from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'
import { useHomeRecording, useLiveTranscriptDisplay } from '@renderer/stores/homeStore'
import { useEffect, useState } from 'react'

function useRecordingElapsed(active: boolean, startedAt: number | null): number {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!active || startedAt === null) {
      return
    }

    const tick = (): void => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }

    const timeoutId = window.setTimeout(tick, 0)
    const intervalId = window.setInterval(tick, 1000)
    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [active, startedAt])

  if (!active || startedAt === null) {
    return 0
  }

  return elapsed
}

function RecordingControls() {
  const {
    isRecording,
    isStarting,
    isStopping,
    recordingError,
    recordingWarning,
    recordingStartedAt,
    startRecording,
    stopRecording
  } = useHomeRecording()

  const elapsedSeconds = useRecordingElapsed(isRecording, recordingStartedAt)
  const isRecordDisabled = isStarting || isStopping

  const handleRecordClick = (): void => {
    void (isRecording ? stopRecording() : startRecording())
  }

  return (
    <>
      <Button
        onClick={handleRecordClick}
        disabled={isRecordDisabled}
        className={cn(
          'mt-2 flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-3.5',
          'text-base font-medium transition-colors',
          controlFocus,
          'disabled:cursor-not-allowed disabled:opacity-60',
          isRecording ? recordButtonLive : recordButtonIdle
        )}
      >
        {isRecording ? (
          <>
            <StopIcon className="h-5 w-5" />
            {isStopping ? 'Stopping…' : `Stop recording (${formatDuration(elapsedSeconds)})`}
          </>
        ) : (
          <>
            <MicrophoneIcon className="h-5 w-5" />
            {isStarting ? 'Starting…' : 'Start recording'}
          </>
        )}
      </Button>

      {recordingWarning ? <p className="mt-3 text-xs text-amber-500">{recordingWarning}</p> : null}

      {recordingError ? <p className="mt-3 text-xs text-red-400">{recordingError}</p> : null}
    </>
  )
}

function LiveTranscriptPanel() {
  const liveTranscriptText = useLiveTranscriptDisplay()

  if (!liveTranscriptText) {
    return null
  }

  return (
    <div className={cn('mt-4 rounded-xl border p-4', surfaceBorder, surfaceMuted)}>
      <p className="text-ash text-xs font-medium tracking-wide uppercase">Live transcript</p>
      <p className="text-ink mt-2 text-sm leading-relaxed">{liveTranscriptText}</p>
    </div>
  )
}

export function HomeSection() {
  return (
    <section className="border-b border-neutral-900/80 pt-6 pb-8">
      <div>
        <h2 className="font-display text-ink text-xl">Record a meeting</h2>
        <p className="text-ash mt-1 text-sm">Capture audio and get a transcript with AI summary.</p>
      </div>
      <RecordingControls />
      <LiveTranscriptPanel />
    </section>
  )
}
