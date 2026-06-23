import { Button, Tab, TabList } from '@headlessui/react'
import { DocumentDuplicateIcon } from '@heroicons/react/16/solid'
import { DEFAULT_SUMMARY_MARKDOWN } from '@shared/summary/defaultSummary'
import { cn } from '@renderer/lib/utils'
import { useDetailStore } from '@renderer/stores/detailStore'
import { useSelectedSession } from '@renderer/stores/sessionNavigationStore'
import { useToastStore } from '@renderer/stores/toastStore'
import type { TranscriptEntry } from '@renderer/types/meeting'

const TABS = ['Summary', 'Transcript'] as const

function formatTranscriptForCopy(entries: TranscriptEntry[] | undefined): string {
  if (!entries?.length) {
    return ''
  }

  return entries.map((entry) => `${entry.speaker} (${entry.time}): ${entry.text}`).join('\n\n')
}

async function copyToClipboard(text: string): Promise<void> {
  if (text) {
    await navigator.clipboard.writeText(text)
  }
}

export function SessionDetailTabs() {
  const session = useSelectedSession()
  const activeTab = useDetailStore((state) => state.activeTab)
  const showToast = useToastStore((state) => state.showToast)
  const isTranscriptTab = activeTab === 'transcript'
  const copyLabel = isTranscriptTab ? 'Copy full transcript' : 'Copy full summary'
  const copyContent = isTranscriptTab
    ? formatTranscriptForCopy(session?.transcript)
    : (session?.summary ?? DEFAULT_SUMMARY_MARKDOWN)

  const handleCopy = async (): Promise<void> => {
    if (!copyContent) {
      return
    }

    await copyToClipboard(copyContent)
    showToast('Copied to clipboard')
  }

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <TabList className="inline-flex rounded-full bg-neutral-900/80 p-1">
        {TABS.map((label) => (
          <Tab
            key={label}
            className={({ selected }) =>
              cn(
                'rounded-full px-3 py-1 text-xs outline-none',
                selected ? 'text-ink bg-neutral-800' : 'text-ash hover:text-neutral-200'
              )
            }
          >
            {label}
          </Tab>
        ))}
      </TabList>

      <Button
        onClick={() => void handleCopy()}
        disabled={!copyContent}
        className={cn(
          'text-ash flex shrink-0 items-center gap-1.5 text-xs',
          'hover:text-ink transition-colors',
          'focus-visible:ring-signal/60 focus:outline-none focus-visible:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-40'
        )}
      >
        <DocumentDuplicateIcon className="h-4 w-4" />
        {copyLabel}
      </Button>
    </div>
  )
}
