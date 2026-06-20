import { SessionListItem } from '@renderer/components/SessionListItem'
import { cn } from '@renderer/lib/utils'
import type { SessionDateGroup as SessionDateGroupType } from '@renderer/lib/format'

type SessionDateGroupProps = {
  group: SessionDateGroupType
  isFirst: boolean
  onSelect: (id: string) => void
}

export function SessionDateGroup({
  group,
  isFirst,
  onSelect
}: SessionDateGroupProps): React.JSX.Element {
  return (
    <section>
      <h2 className={cn('pb-2 text-sm text-neutral-500', isFirst ? 'pt-6' : 'pt-8')}>
        {group.label}
      </h2>
      <ul className="flex flex-col">
        {group.sessions.map((session) => (
          <li key={session.id}>
            <SessionListItem session={session} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </section>
  )
}
