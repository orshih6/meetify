import { TabGroup, TabPanel, TabPanels } from '@headlessui/react'
import { ContentContainer } from '@renderer/components/ContentContainer'
import { SessionAskBar } from '@renderer/components/detail/SessionAskBar'
import { SessionDetailHeader } from '@renderer/components/detail/SessionDetailHeader'
import { SessionDetailTabs } from '@renderer/components/detail/SessionDetailTabs'
import { SummaryPanel } from '@renderer/components/detail/SummaryPanel'
import { TranscriptPanel } from '@renderer/components/detail/TranscriptPanel'
import { detailTabToIndex, indexToDetailTab, useDetailStore } from '@renderer/stores/detailStore'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import { useSelectedSession } from '@renderer/stores/sessionNavigationStore'
import { useEffect } from 'react'

export function SessionDetail() {
  const session = useSelectedSession()
  const selectedSessionId = session?.id
  const loadSessionDetail = useSessionCatalogStore((state) => state.loadSessionDetail)
  const activeTab = useDetailStore((state) => state.activeTab)
  const setActiveTab = useDetailStore((state) => state.setActiveTab)

  useEffect(() => {
    if (selectedSessionId) {
      void loadSessionDetail(selectedSessionId)
    }
  }, [loadSessionDetail, selectedSessionId])

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-neutral-500">
        <ContentContainer>Session not found.</ContentContainer>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <div className="flex-1 overflow-y-auto">
        <ContentContainer className="pb-28">
          <SessionDetailHeader />

          <TabGroup
            selectedIndex={detailTabToIndex(activeTab)}
            onChange={(index) => setActiveTab(indexToDetailTab(index))}
          >
            <SessionDetailTabs />

            <TabPanels>
              <TabPanel unmount={false}>
                <SummaryPanel />
              </TabPanel>
              <TabPanel unmount={false}>
                <TranscriptPanel />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </ContentContainer>
      </div>

      <SessionAskBar />
    </div>
  )
}
