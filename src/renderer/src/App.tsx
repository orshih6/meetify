import { AppHeader } from '@renderer/components/AppHeader'
import { SessionDetail } from '@renderer/components/SessionDetail'
import { SessionList } from '@renderer/components/SessionList'
import { useSessionsStore } from '@renderer/stores/sessionsStore'

function App(): React.JSX.Element {
  const selectedSessionId = useSessionsStore((state) => state.selectedSessionId)

  return (
    <div className="flex h-screen flex-col bg-black">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-hidden">
        {selectedSessionId ? <SessionDetail /> : <SessionList />}
      </main>
    </div>
  )
}

export default App
