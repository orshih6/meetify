import { AppHeader } from '@renderer/components/AppHeader'
import { SettingsModal } from '@renderer/components/settings/SettingsModal'
import { SessionDetail } from '@renderer/components/SessionDetail'
import { SessionList } from '@renderer/components/SessionList'
import { Toast } from '@renderer/components/ui/Toast'
import { useHomeStore } from '@renderer/stores/homeStore'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import { useSessionNavigationStore } from '@renderer/stores/sessionNavigationStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useEffect } from 'react'

function App() {
  const selectedSessionId = useSessionNavigationStore((state) => state.selectedSessionId)
  const loadCatalog = useSessionCatalogStore((state) => state.loadCatalog)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const openSettings = useSettingsStore((state) => state.openSettings)
  const startRecording = useHomeStore((state) => state.startRecording)
  const stopRecording = useHomeStore((state) => state.stopRecording)

  useEffect(() => {
    void loadCatalog()
    void loadSettings()
  }, [loadCatalog, loadSettings])

  useEffect(() => {
    const unsubscribers = [
      window.api.shortcut.onOpenSettings(() => {
        openSettings()
      }),
      window.api.shortcut.onStartRecording(() => {
        void startRecording()
      }),
      window.api.shortcut.onStopRecording(() => {
        void stopRecording()
      })
    ]

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
    }
  }, [openSettings, startRecording, stopRecording])

  return (
    <div className="bg-void flex h-screen flex-col">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-hidden">
        {selectedSessionId ? <SessionDetail key={selectedSessionId} /> : <SessionList />}
      </main>
      <SettingsModal />
      <Toast />
    </div>
  )
}

export default App
