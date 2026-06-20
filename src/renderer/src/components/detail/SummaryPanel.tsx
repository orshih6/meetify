import { FollowUpDraft } from '@renderer/components/detail/FollowUpDraft'
import type { MeetingSession } from '@renderer/types/meeting'

type SummaryPanelProps = {
  session: MeetingSession
}

export function SummaryPanel({ session }: SummaryPanelProps): React.JSX.Element {
  return <FollowUpDraft session={session} />
}
