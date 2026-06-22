import { Button, Switch } from '@headlessui/react'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/16/solid'
import { formatDuration } from '@renderer/lib/format'
import { cn } from '@renderer/lib/utils'
import { useHomeStore } from '@renderer/stores/homeStore'
import { useEffect, useState } from 'react'

export function HomeSection() {
  const isDetectable = useHomeStore((state) => state.isDetectable)
  const isRecording = useHomeStore((state) => state.isRecording)
  const isStarting = useHomeStore((state) => state.isStarting)
  const isStopping = useHomeStore((state) => state.isStopping)
  const recordingError = useHomeStore((state) => state.recordingError)
  const recordingWarning = useHomeStore((state) => state.recordingWarning)
  const liveTranscript = useHomeStore((state) => state.liveTranscript)
  const recordingStartedAt = useHomeStore((state) => state.recordingStartedAt)
  const toggleDetectable = useHomeStore((state) => state.toggleDetectable)
  const startRecording = useHomeStore((state) => state.startRecording)
  const stopRecording = useHomeStore((state) => state.stopRecording)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!isRecording || recordingStartedAt === null) {
      return
    }

    const updateElapsed = (): void => {
      setElapsedSeconds(Math.floor((Date.now() - recordingStartedAt) / 1000))
    }

    const timeoutId = window.setTimeout(updateElapsed, 0)
    const intervalId = window.setInterval(updateElapsed, 1000)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [isRecording, recordingStartedAt])

  const displayElapsed = isRecording ? elapsedSeconds : 0

  const isRecordDisabled = isStarting || isStopping

  return (
    <section className="border-b border-neutral-900 pt-6 pb-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Auto-detect meetings</p>
          <p className="mt-1 text-sm text-neutral-500">
            Automatically detect when a meeting starts
          </p>
        </div>
        <Switch
          checked={isDetectable}
          onChange={() => toggleDetectable()}
          className={cn(
            'group relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5',
            'bg-neutral-800 ring-1 ring-neutral-700 ring-inset',
            'transition-colors duration-200 ease-in-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
            'data-checked:bg-white data-checked:ring-white/30'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block size-6 rounded-full bg-neutral-500 shadow-sm',
              'transition duration-200 ease-in-out',
              'group-data-checked:translate-x-5 group-data-checked:bg-neutral-950'
            )}
          />
        </Switch>
      </div>

      <Button
        onClick={() => void (isRecording ? stopRecording() : startRecording())}
        disabled={isRecordDisabled}
        className={cn(
          'mt-6 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3',
          'text-sm font-medium transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600',
          'disabled:cursor-not-allowed disabled:opacity-60',
          isRecording
            ? 'bg-red-600 text-white hover:bg-red-500'
            : 'border border-neutral-700 text-white hover:border-neutral-600 hover:bg-neutral-900'
        )}
      >
        {isRecording ? (
          <>
            <StopIcon className="h-4 w-4" />
            {isStopping ? 'Stopping...' : `Stop Record (${formatDuration(displayElapsed)})`}
          </>
        ) : (
          <>
            <MicrophoneIcon className="h-4 w-4" />
            {isStarting ? 'Starting...' : 'Start Record'}
          </>
        )}
      </Button>

      {recordingWarning ? <p className="mt-3 text-xs text-amber-500">{recordingWarning}</p> : null}

      {recordingError ? <p className="mt-3 text-xs text-red-400">{recordingError}</p> : null}

      {liveTranscript ? (
        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
            Live transcript
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white">{liveTranscript}</p>
        </div>
      ) : null}
    </section>
  )
}
