import { Button, Tab, TabList } from '@headlessui/react'
import { DocumentDuplicateIcon } from '@heroicons/react/16/solid'
import { DEFAULT_SUMMARY_MARKDOWN } from '@renderer/data/mockSessions'
import { copyToClipboard } from '@renderer/lib/clipboard'
import { formatTranscriptForCopy } from '@renderer/lib/transcript'
import { cn } from '@renderer/lib/utils'
import { useDetailStore } from '@renderer/stores/detailStore'
import type { MeetingSession } from '@renderer/types/meeting'

const TABS = ['Summary', 'Transcript'] as const

type SessionDetailTabsProps = {
  session: MeetingSession
}

export function SessionDetailTabs({ session }: SessionDetailTabsProps): React.JSX.Element {
  const activeTab = useDetailStore((state) => state.activeTab)
  const isTranscriptTab = activeTab === 'transcript'
  const copyLabel = isTranscriptTab ? 'Copy full transcript' : 'Copy full summary'
  const copyContent = isTranscriptTab
    ? formatTranscriptForCopy(session.transcript)
    : (session.summary ?? DEFAULT_SUMMARY_MARKDOWN)

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
        onClick={() => void copyToClipboard(copyContent)}
        className={cn(
          'flex shrink-0 items-center gap-1.5 text-sm text-neutral-400',
          'transition-colors hover:text-white',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
        )}
      >
        <DocumentDuplicateIcon className="h-4 w-4" />
        {copyLabel}
      </Button>
    </div>
  )
}
