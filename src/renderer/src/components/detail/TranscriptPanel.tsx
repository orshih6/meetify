import { TranscriptEntry } from '@renderer/components/detail/TranscriptEntry'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { useSelectedSession } from '@renderer/stores/sessionNavigationStore'
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/16/solid'

export function TranscriptPanel() {
  const session = useSelectedSession()

  if (!session?.transcript?.length) {
    return (
      <section className="mt-6">
        <EmptyState
          icon={ChatBubbleBottomCenterTextIcon}
          title="No transcript yet"
          description="The full transcript will appear here after you record a meeting."
          className="py-8"
        />
      </section>
    )
  }

  return (
    <section className="mt-6 space-y-5">
      {session.transcript.map((entry, index) => (
        <TranscriptEntry key={`${entry.speaker}-${entry.time}-${index}`} entry={entry} />
      ))}
    </section>
  )
}
