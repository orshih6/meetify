import { Button } from '@headlessui/react'
import { TrashIcon } from '@heroicons/react/16/solid'
import { DeleteSessionDialog } from '@renderer/components/DeleteSessionDialog'
import { formatSessionListMeta, formatSessionListTitle } from '@renderer/lib/format'
import { cn } from '@renderer/lib/utils'
import { useSessionNavigationStore } from '@renderer/stores/sessionNavigationStore'
import type { MeetingSession } from '@renderer/types/meeting'
import { useState } from 'react'

type SessionListItemProps = {
  session: MeetingSession
}

const iconButtonClass = cn(
  'rounded p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
)

function SessionStatusLabel({ session }: { session: MeetingSession }) {
  if (session.summaryStatus === 'processing') {
    return <span className="text-xs text-amber-400">Processing…</span>
  }

  if (session.summaryStatus === 'error') {
    return <span className="text-xs text-red-400">Summary failed</span>
  }

  return (
    <span className="text-xs text-neutral-500 tabular-nums">{formatSessionListMeta(session)}</span>
  )
}

export function SessionListItem({ session }: SessionListItemProps) {
  const selectSession = useSessionNavigationStore((state) => state.selectSession)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  return (
    <>
      <div
        className={cn(
          'group flex w-full items-center gap-3',
          'border-l-2 border-l-transparent py-2.5 pl-2',
          'transition-colors hover:border-l-neutral-600 hover:bg-neutral-900/40'
        )}
      >
        <Button
          onClick={() => selectSession(session.id)}
          className={cn(
            'flex min-w-0 flex-1 items-center justify-between gap-3 text-left',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
          )}
        >
          <span className="truncate text-sm font-medium text-neutral-100">
            {formatSessionListTitle(session)}
          </span>
          <SessionStatusLabel session={session} />
        </Button>

        <Button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          aria-label={`Delete ${session.title}`}
          className={cn(
            iconButtonClass,
            'shrink-0 text-neutral-500 opacity-0 transition-opacity',
            'group-hover:opacity-100 hover:text-red-400 focus-visible:opacity-100'
          )}
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      <DeleteSessionDialog
        session={session}
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  )
}
