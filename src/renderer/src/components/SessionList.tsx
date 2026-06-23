import { ContentContainer } from '@renderer/components/ContentContainer'
import { HomeSection } from '@renderer/components/home/HomeSection'
import { SessionDateGroup } from '@renderer/components/SessionDateGroup'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { SessionListSkeleton } from '@renderer/components/ui/Skeleton'
import { groupSessionsByDate } from '@renderer/lib/sessions'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import { MicrophoneIcon } from '@heroicons/react/16/solid'

export function SessionList() {
  const sessions = useSessionCatalogStore((state) => state.sessions)
  const isLoading = useSessionCatalogStore((state) => state.isLoading)
  const loadError = useSessionCatalogStore((state) => state.loadError)
  const groups = groupSessionsByDate(sessions)

  return (
    <div className="bg-void h-full overflow-y-auto">
      <ContentContainer className="pb-8">
        <HomeSection />
        {loadError ? <p className="mt-4 text-xs text-red-400">{loadError}</p> : null}
        {isLoading ? <SessionListSkeleton /> : null}
        {!isLoading && sessions.length === 0 && !loadError ? (
          <EmptyState
            className="pt-2"
            icon={MicrophoneIcon}
            title="No meetings yet"
            description="Start a recording above to capture your first meeting."
          />
        ) : null}
        {!isLoading
          ? groups.map((group, index) => (
              <SessionDateGroup key={group.label} group={group} isFirst={index === 0} />
            ))
          : null}
      </ContentContainer>
    </div>
  )
}
