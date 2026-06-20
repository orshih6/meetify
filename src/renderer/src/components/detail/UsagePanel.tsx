import { DurationBadge } from '@renderer/components/DurationBadge'
import { formatSessionTime } from '@renderer/lib/format'
import type { MeetingSession } from '@renderer/types/meeting'

type UsagePanelProps = {
  session: MeetingSession
}

export function UsagePanel({ session }: UsagePanelProps): React.JSX.Element {
  return (
    <section className="mt-8">
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <DurationBadge durationSeconds={session.durationSeconds} />
          <span className="text-sm text-neutral-500">
            Started at {formatSessionTime(session.startedAt)}
          </span>
        </div>
        <p className="mt-4 text-sm text-neutral-500">Usage details will appear here</p>
      </div>
    </section>
  )
}
