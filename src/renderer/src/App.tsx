import { AppHeader } from '@renderer/components/AppHeader'
import { SettingsModal } from '@renderer/components/settings/SettingsModal'
import { SessionDetail } from '@renderer/components/SessionDetail'
import { SessionList } from '@renderer/components/SessionList'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import { useSessionNavigationStore } from '@renderer/stores/sessionNavigationStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useEffect } from 'react'

function App() {
  const selectedSessionId = useSessionNavigationStore((state) => state.selectedSessionId)
  const loadCatalog = useSessionCatalogStore((state) => state.loadCatalog)
  const loadSettings = useSettingsStore((state) => state.loadSettings)

  useEffect(() => {
    void loadCatalog()
    void loadSettings()
  }, [loadCatalog, loadSettings])

  return (
    <div className="flex h-screen flex-col bg-black">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-hidden">
        {selectedSessionId ? <SessionDetail key={selectedSessionId} /> : <SessionList />}
      </main>
      <SettingsModal />
    </div>
  )
}

export default App
