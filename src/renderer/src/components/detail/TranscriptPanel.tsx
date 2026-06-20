import { TranscriptEntry } from '@renderer/components/detail/TranscriptEntry'
import type { MeetingSession } from '@renderer/types/meeting'

type TranscriptPanelProps = {
  session: MeetingSession
}

export function TranscriptPanel({ session }: TranscriptPanelProps): React.JSX.Element {
  if (!session.transcript?.length) {
    return (
      <section className="mt-8">
        <p className="text-sm text-neutral-500">Transcript will appear here</p>
      </section>
    )
  }

  return (
    <section className="mt-8 space-y-6">
      {session.transcript.map((entry, index) => (
        <TranscriptEntry key={`${entry.speaker}-${entry.time}-${index}`} entry={entry} />
      ))}
    </section>
  )
}
