import { TranscriptEntry } from '@renderer/components/detail/TranscriptEntry'
import { useSelectedSession } from '@renderer/stores/sessionNavigationStore'

export function TranscriptPanel() {
  const session = useSelectedSession()

  if (!session?.transcript?.length) {
    return (
      <section className="mt-6">
        <p className="text-xs text-neutral-600">Transcript will appear here</p>
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
