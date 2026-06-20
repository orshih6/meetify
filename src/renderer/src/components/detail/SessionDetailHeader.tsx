import { formatDetailDate } from '@renderer/lib/format'
import type { MeetingSession } from '@renderer/types/meeting'

type SessionDetailHeaderProps = {
  session: MeetingSession
}

export function SessionDetailHeader({ session }: SessionDetailHeaderProps): React.JSX.Element {
  return (
    <header className="pt-8">
      <p className="text-sm text-neutral-500">{formatDetailDate(session.startedAt)}</p>
      <h1 className="mt-1 text-3xl font-semibold text-white">{session.title}</h1>
    </header>
  )
}
