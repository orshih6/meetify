import { SessionListItem } from '@renderer/components/SessionListItem'
import { cn } from '@renderer/lib/utils'
import type { SessionDateGroup as SessionDateGroupType } from '@renderer/lib/sessions'

type SessionDateGroupProps = {
  group: SessionDateGroupType
  isFirst: boolean
}

export function SessionDateGroup({ group, isFirst }: SessionDateGroupProps) {
  return (
    <section>
      <h2 className={cn('pb-2 text-sm text-neutral-500', isFirst ? 'pt-6' : 'pt-8')}>
        {group.label}
      </h2>
      <ul className="flex flex-col">
        {group.sessions.map((session) => (
          <li key={session.id}>
            <SessionListItem session={session} />
          </li>
        ))}
      </ul>
    </section>
  )
}
