import { TabGroup, TabPanel, TabPanels } from '@headlessui/react'
import { SessionAskBar } from '@renderer/components/detail/SessionAskBar'
import { SessionDetailHeader } from '@renderer/components/detail/SessionDetailHeader'
import { SessionDetailTabs } from '@renderer/components/detail/SessionDetailTabs'
import { SummaryPanel } from '@renderer/components/detail/SummaryPanel'
import { TranscriptPanel } from '@renderer/components/detail/TranscriptPanel'
import { UsagePanel } from '@renderer/components/detail/UsagePanel'
import {
  detailTabToIndex,
  indexToDetailTab,
  useDetailStore
} from '@renderer/stores/detailStore'
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
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-neutral-500">
        Session not found.
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex-1 overflow-y-auto px-6 pb-28">
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
            <TabPanel unmount={false}>
              <UsagePanel session={session} />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>

      <SessionAskBar />
    </div>
  )
}
