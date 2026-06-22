import { DEFAULT_SUMMARY_MARKDOWN } from '@shared/summary/defaultSummary'
import { MarkdownContent } from '@renderer/components/detail/MarkdownContent'
import { useSelectedSession } from '@renderer/stores/sessionNavigationStore'

const GENERATING_SUMMARY_MARKDOWN = `# Session Summary

## Overview
Generating summary from the meeting transcript…

## Key Takeaways
- Summary will appear here when processing completes
`

export function SummaryPanel() {
  const session = useSelectedSession()

  if (!session) {
    return null
  }

  if (session.summaryStatus === 'processing') {
    return <MarkdownContent content={GENERATING_SUMMARY_MARKDOWN} />
  }

  if (session.summaryStatus === 'error') {
    return (
      <MarkdownContent
        content={`# Session Summary\n\n## Overview\nSummary generation failed. Try recording again or check your API configuration.\n`}
      />
    )
  }

  return <MarkdownContent content={session.summary ?? DEFAULT_SUMMARY_MARKDOWN} />
}
