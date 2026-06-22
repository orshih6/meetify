import { ContentContainer } from '@renderer/components/ContentContainer'
import { HomeSection } from '@renderer/components/home/HomeSection'
import { SessionDateGroup } from '@renderer/components/SessionDateGroup'
import { groupSessionsByDate } from '@renderer/lib/sessions'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'

export function SessionList() {
  const sessions = useSessionCatalogStore((state) => state.sessions)
  const loadError = useSessionCatalogStore((state) => state.loadError)
  const groups = groupSessionsByDate(sessions)

  return (
    <div className="h-full overflow-y-auto bg-black">
      <ContentContainer className="pb-8">
        <HomeSection />
        {loadError ? <p className="mt-4 text-xs text-red-400">{loadError}</p> : null}
        {sessions.length === 0 && !loadError ? (
          <p className="pt-5 text-sm text-neutral-600">No meetings yet. Start a recording above.</p>
        ) : null}
        {groups.map((group, index) => (
          <SessionDateGroup key={group.label} group={group} isFirst={index === 0} />
        ))}
      </ContentContainer>
    </div>
  )
}
