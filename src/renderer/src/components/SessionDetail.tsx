import { TabGroup, TabPanel, TabPanels } from '@headlessui/react'
import { ContentContainer } from '@renderer/components/ContentContainer'
import { SessionAskBar } from '@renderer/components/detail/SessionAskBar'
import { SessionDetailHeader } from '@renderer/components/detail/SessionDetailHeader'
import { SessionDetailTabs } from '@renderer/components/detail/SessionDetailTabs'
import { SummaryPanel } from '@renderer/components/detail/SummaryPanel'
import { TranscriptPanel } from '@renderer/components/detail/TranscriptPanel'
import { detailTabToIndex, indexToDetailTab, useDetailStore } from '@renderer/stores/detailStore'
import { useSelectedSession } from '@renderer/stores/sessionsStore'
import { useEffect } from 'react'

export function SessionDetail(): React.JSX.Element {
  const session = useSelectedSession()
  const activeTab = useDetailStore((state) => state.activeTab)
  const setActiveTab = useDetailStore((state) => state.setActiveTab)
  const resetDetail = useDetailStore((state) => state.resetDetail)

  useEffect(() => {
    return () => resetDetail()
  }, [resetDetail])

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-neutral-500">
        <ContentContainer>Session not found.</ContentContainer>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex-1 overflow-y-auto">
        <ContentContainer className="pb-28">
          <SessionDetailHeader session={session} />

          <TabGroup
            selectedIndex={detailTabToIndex(activeTab)}
            onChange={(index) => setActiveTab(indexToDetailTab(index))}
          >
            <SessionDetailTabs session={session} />

            <TabPanels>
              <TabPanel unmount={false}>
                <SummaryPanel session={session} />
              </TabPanel>
              <TabPanel unmount={false}>
                <TranscriptPanel session={session} />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </ContentContainer>
      </div>

      <SessionAskBar />
    </div>
  )
}
