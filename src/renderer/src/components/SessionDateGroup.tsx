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
      <h2
        className={cn(
          'pb-2 text-xs font-medium tracking-wider text-neutral-600 uppercase',
          isFirst ? 'pt-5' : 'pt-6'
        )}
      >
        {group.label}
      </h2>
      <ul className="flex flex-col divide-y divide-neutral-900/80">
        {group.sessions.map((session) => (
          <li key={session.id}>
            <SessionListItem session={session} />
          </li>
        ))}
      </ul>
    </section>
  )
}
