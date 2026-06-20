import type { MeetingSession } from '@renderer/types/meeting'

type TranscriptPanelProps = {
  session: MeetingSession
}

export function TranscriptPanel({ session }: TranscriptPanelProps): React.JSX.Element {
  return (
    <section className="mt-8">
      {session.transcript ? (
        <p className="whitespace-pre-wrap text-neutral-300">{session.transcript}</p>
      ) : (
        <p className="text-sm text-neutral-500">Transcript will appear here</p>
      )}
    </section>
  )
}
