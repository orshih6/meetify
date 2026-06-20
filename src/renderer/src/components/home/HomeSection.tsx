import { Button, Switch } from '@headlessui/react'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/16/solid'
import { cn } from '@renderer/lib/utils'
import { useHomeStore } from '@renderer/stores/homeStore'

export function HomeSection(): React.JSX.Element {
  const isDetectable = useHomeStore((state) => state.isDetectable)
  const isRecording = useHomeStore((state) => state.isRecording)
  const toggleDetectable = useHomeStore((state) => state.toggleDetectable)
  const startRecording = useHomeStore((state) => state.startRecording)
  const stopRecording = useHomeStore((state) => state.stopRecording)

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
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          'mt-6 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3',
          'text-sm font-medium transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600',
          isRecording
            ? 'bg-red-600 text-white hover:bg-red-500'
            : 'border border-neutral-700 text-white hover:border-neutral-600 hover:bg-neutral-900'
        )}
      >
        {isRecording ? (
          <>
            <StopIcon className="h-4 w-4" />
            Stop Record
          </>
        ) : (
          <>
            <MicrophoneIcon className="h-4 w-4" />
            Start Record
          </>
        )}
      </Button>
    </section>
  )
}
