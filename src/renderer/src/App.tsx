import { SessionDetail } from '@renderer/components/SessionDetail'
import { SessionList } from '@renderer/components/SessionList'
import { useSessionsStore } from '@renderer/stores/sessionsStore'

function App(): React.JSX.Element {
  const selectedSessionId = useSessionsStore((state) => state.selectedSessionId)

  return selectedSessionId ? <SessionDetail /> : <SessionList />
}

export default App
