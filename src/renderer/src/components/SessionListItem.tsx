import { Button } from '@headlessui/react'
import { DurationBadge } from '@renderer/components/DurationBadge'
import { formatSessionTime } from '@renderer/lib/format'
import { cn } from '@renderer/lib/utils'
import { useSessionNavigationStore } from '@renderer/stores/sessionNavigationStore'
import type { MeetingSession } from '@renderer/types/meeting'

type SessionListItemProps = {
  session: MeetingSession
}

function SessionStatusLabel({ session }: { session: MeetingSession }) {
  if (session.summaryStatus === 'processing') {
    return <span className="text-xs text-amber-400">Processing…</span>
  }

  if (session.summaryStatus === 'error') {
    return <span className="text-xs text-red-400">Summary failed</span>
  }

  return (
    <span className="text-sm text-neutral-500 tabular-nums">
      {formatSessionTime(session.startedAt)}
    </span>
  )
}

export function SessionListItem({ session }: SessionListItemProps) {
  const selectSession = useSessionNavigationStore((state) => state.selectSession)

  return (
    <div
      className={cn(
        'group flex w-full items-center justify-between gap-4 rounded-lg px-2 py-3',
        'transition-colors hover:bg-neutral-900/60'
      )}
    >
      <Button
        onClick={() => selectSession(session.id)}
        className={cn(
          'flex min-w-0 flex-1 items-center justify-between gap-4 text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
        )}
      >
        <span className="truncate font-medium text-white">{session.title}</span>
        <DurationBadge durationSeconds={session.durationSeconds} />
      </Button>

      <div className="w-24 shrink-0 text-right">
        <SessionStatusLabel session={session} />
      </div>
    </div>
  )
}
