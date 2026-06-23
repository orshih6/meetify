import { Button } from '@headlessui/react'
import { DEFAULT_SUMMARY_MARKDOWN } from '@shared/summary/defaultSummary'
import { MarkdownContent } from '@renderer/components/detail/MarkdownContent'
import { SummarySkeleton } from '@renderer/components/ui/Skeleton'
import { cn } from '@renderer/lib/utils'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import { useSelectedSession } from '@renderer/stores/sessionNavigationStore'
import { ArrowPathIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'

export function SummaryPanel() {
  const session = useSelectedSession()
  const requestSummary = useSessionCatalogStore((state) => state.requestSummary)
  const [isRetrying, setIsRetrying] = useState(false)

  if (!session) {
    return null
  }

  const handleRetry = async (): Promise<void> => {
    setIsRetrying(true)
    try {
      await requestSummary(session.id)
    } finally {
      setIsRetrying(false)
    }
  }

  if (session.summaryStatus === 'processing') {
    return <SummarySkeleton />
  }

  if (session.summaryStatus === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-sm text-red-300">Summary generation failed.</p>
          <p className="text-ash mt-1 text-xs">
            Check your OpenAI API key in settings, then try again.
          </p>
          <Button
            onClick={() => void handleRetry()}
            disabled={isRetrying}
            className={cn(
              'mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
              'bg-graphite text-ink text-xs font-medium',
              'border border-neutral-700 transition-colors hover:border-neutral-600',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            <ArrowPathIcon className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
            {isRetrying ? 'Retrying…' : 'Retry summary'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MarkdownContent content={session.summary ?? DEFAULT_SUMMARY_MARKDOWN} />
      {session.summary ? (
        <Button
          onClick={() => void handleRetry()}
          disabled={isRetrying}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs text-neutral-500',
            'transition-colors hover:text-neutral-300',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60',
            'disabled:cursor-not-allowed disabled:opacity-60'
          )}
        >
          <ArrowPathIcon className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Regenerating…' : 'Regenerate summary'}
        </Button>
      ) : null}
    </div>
  )
}
