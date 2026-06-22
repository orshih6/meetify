import { Button, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ArrowDownTrayIcon, EllipsisHorizontalIcon, TrashIcon } from '@heroicons/react/16/solid'
import { DurationBadge } from '@renderer/components/DurationBadge'
import { formatSessionTime } from '@renderer/lib/format'
import { cn } from '@renderer/lib/utils'
import { useSessionsStore } from '@renderer/stores/sessionsStore'
import type { MeetingSession } from '@renderer/types/meeting'

type SessionListItemProps = {
  session: MeetingSession
}

export function SessionListItem({ session }: SessionListItemProps) {
  const selectSession = useSessionsStore((state) => state.selectSession)
  const deleteSession = useSessionsStore((state) => state.deleteSession)
  const exportSession = useSessionsStore((state) => state.exportSession)

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

      <div className="relative w-16 shrink-0">
        <span
          className={cn(
            'block text-right text-sm text-neutral-500 tabular-nums transition-opacity',
            'group-hover:opacity-0'
          )}
        >
          {formatSessionTime(session.startedAt)}
        </span>

        <Menu as="div" className="absolute inset-0 flex items-center justify-end">
          <MenuButton
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'rounded p-1 opacity-0 transition-opacity group-hover:opacity-100',
              'text-neutral-400 hover:text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
            )}
          >
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </MenuButton>

          <MenuItems
            anchor="bottom end"
            className={cn(
              'z-10 mt-1 min-w-36 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-lg',
              'focus:outline-none'
            )}
          >
            <MenuItem>
              <button
                type="button"
                onClick={() => exportSession(session.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-white',
                  'data-focus:bg-neutral-800'
                )}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
              </button>
            </MenuItem>
            <MenuItem>
              <button
                type="button"
                onClick={() => deleteSession(session.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500',
                  'data-focus:bg-neutral-800'
                )}
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </div>
  )
}
