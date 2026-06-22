import { formatDetailDate } from '@renderer/lib/format'
import { useSelectedSession } from '@renderer/stores/sessionNavigationStore'

export function SessionDetailHeader() {
  const session = useSelectedSession()

  if (!session) {
    return null
  }

  return (
    <header className="pt-8">
      <p className="text-xs text-neutral-500">{formatDetailDate(session.startedAt)}</p>
      <h1 className="mt-1 text-xl font-semibold text-white">{session.title}</h1>
    </header>
  )
}
