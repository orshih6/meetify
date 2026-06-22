import { DEFAULT_SUMMARY_MARKDOWN } from '@renderer/data/mockSessions'
import { MarkdownContent } from '@renderer/components/detail/MarkdownContent'
import { useSelectedSession } from '@renderer/stores/sessionsStore'

export function SummaryPanel() {
  const session = useSelectedSession()

  return <MarkdownContent content={session?.summary ?? DEFAULT_SUMMARY_MARKDOWN} />
}
