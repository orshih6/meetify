import { DEFAULT_SUMMARY_MARKDOWN } from '@renderer/data/mockSessions'
import { MarkdownContent } from '@renderer/components/detail/MarkdownContent'
import type { MeetingSession } from '@renderer/types/meeting'

type SummaryPanelProps = {
  session: MeetingSession
}

export function SummaryPanel({ session }: SummaryPanelProps) {
  return <MarkdownContent content={session.summary ?? DEFAULT_SUMMARY_MARKDOWN} />
}
