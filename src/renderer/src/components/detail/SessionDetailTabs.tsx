import { Button, Tab, TabList } from '@headlessui/react'
import { DocumentDuplicateIcon } from '@heroicons/react/16/solid'
import { DEFAULT_FOLLOW_UP_DRAFT } from '@renderer/data/mockSessions'
import { copyToClipboard } from '@renderer/lib/clipboard'
import { cn } from '@renderer/lib/utils'
import type { MeetingSession } from '@renderer/types/meeting'

const TABS = ['Summary', 'Transcript', 'Usage'] as const

type SessionDetailTabsProps = {
  session: MeetingSession
}

export function SessionDetailTabs({ session }: SessionDetailTabsProps): React.JSX.Element {
  const fullSummary = session.summary ?? session.followUpDraft ?? DEFAULT_FOLLOW_UP_DRAFT

  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      <TabList className="inline-flex rounded-full bg-neutral-900/80 p-1">
        {TABS.map((label) => (
          <Tab
            key={label}
            className={({ selected }) =>
              cn(
                'rounded-full px-4 py-1.5 text-sm outline-none',
                selected ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
              )
            }
          >
            {label}
          </Tab>
        ))}
      </TabList>

      <Button
        onClick={() => void copyToClipboard(fullSummary)}
        className={cn(
          'flex shrink-0 items-center gap-1.5 text-sm text-neutral-400',
          'transition-colors hover:text-white',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
        )}
      >
        <DocumentDuplicateIcon className="h-4 w-4" />
        Copy full summary
      </Button>
    </div>
  )
}
