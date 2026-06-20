import { Button } from '@headlessui/react'
import { DEFAULT_FOLLOW_UP_DRAFT } from '@renderer/data/mockSessions'
import { copyToClipboard } from '@renderer/lib/clipboard'
import { cn } from '@renderer/lib/utils'
import type { MeetingSession } from '@renderer/types/meeting'

type FollowUpDraftProps = {
  session: MeetingSession
}

export function FollowUpDraft({ session }: FollowUpDraftProps): React.JSX.Element {
  const draft = session.followUpDraft ?? DEFAULT_FOLLOW_UP_DRAFT

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-white">Follow-up Draft</h2>
        <Button
          onClick={() => void copyToClipboard(draft)}
          className={cn(
            'rounded-md border border-neutral-700 px-3 py-1 text-sm text-neutral-300',
            'transition-colors hover:border-neutral-600 hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
          )}
        >
          Copy
        </Button>
      </div>
      <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-5 whitespace-pre-wrap text-neutral-400">
        {draft}
      </div>
    </section>
  )
}
