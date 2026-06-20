import { SessionDateGroup } from '@renderer/components/SessionDateGroup'
import { groupSessionsByDate } from '@renderer/lib/format'
import { useSessionsStore } from '@renderer/stores/sessionsStore'

export function SessionList(): React.JSX.Element {
  const sessions = useSessionsStore((state) => state.sessions)
  const selectSession = useSessionsStore((state) => state.selectSession)
  const groups = groupSessionsByDate(sessions)

  return (
    <div className="min-h-screen overflow-y-auto bg-black px-6 pb-8">
      {groups.map((group, index) => (
        <SessionDateGroup
          key={group.label}
          group={group}
          isFirst={index === 0}
          onSelect={selectSession}
        />
      ))}
    </div>
  )
}
