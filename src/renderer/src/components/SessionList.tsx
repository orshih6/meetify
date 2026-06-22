import { ContentContainer } from '@renderer/components/ContentContainer'
import { HomeSection } from '@renderer/components/home/HomeSection'
import { SessionDateGroup } from '@renderer/components/SessionDateGroup'
import { groupSessionsByDate } from '@renderer/lib/format'
import { useSessionsStore } from '@renderer/stores/sessionsStore'

export function SessionList() {
  const sessions = useSessionsStore((state) => state.sessions)
  const groups = groupSessionsByDate(sessions)

  return (
    <div className="h-full overflow-y-auto bg-black">
      <ContentContainer className="pb-8">
        <HomeSection />
        {groups.map((group, index) => (
          <SessionDateGroup key={group.label} group={group} isFirst={index === 0} />
        ))}
      </ContentContainer>
    </div>
  )
}
