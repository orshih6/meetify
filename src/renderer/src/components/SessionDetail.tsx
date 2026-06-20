import { Button } from '@headlessui/react'
import { ChevronLeftIcon, DocumentTextIcon } from '@heroicons/react/16/solid'
import { DurationBadge } from '@renderer/components/DurationBadge'
import { formatFullDate, formatSessionTime } from '@renderer/lib/format'
import { cn } from '@renderer/lib/utils'
import { useSelectedSession, useSessionsStore } from '@renderer/stores/sessionsStore'

export function SessionDetail(): React.JSX.Element {
  const session = useSelectedSession()
  const clearSelection = useSessionsStore((state) => state.clearSelection)

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-neutral-500">
        Session not found.
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-black px-6 pb-8 text-white">
      <Button
        onClick={clearSelection}
        className={cn(
          'mt-6 flex items-center gap-1 rounded-lg py-2 text-sm text-neutral-400',
          'transition-colors hover:text-white',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
        )}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back
      </Button>

      <header className="mt-6">
        <h1 className="text-2xl font-semibold">{session.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          <span>{formatFullDate(session.startedAt)}</span>
          <span>{formatSessionTime(session.startedAt)}</span>
          <DurationBadge durationSeconds={session.durationSeconds} />
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-neutral-400">Transcript</h2>
        {session.transcript ? (
          <p className="mt-4 whitespace-pre-wrap text-neutral-300">{session.transcript}</p>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-neutral-800 py-16 text-neutral-500">
            <DocumentTextIcon className="mb-3 h-8 w-8 text-neutral-600" />
            <p className="text-sm">Transcript will appear here</p>
          </div>
        )}
      </section>
    </div>
  )
}
