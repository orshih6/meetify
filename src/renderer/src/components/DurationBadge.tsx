import { formatDuration } from '@renderer/lib/format'
import { cn } from '@renderer/lib/utils'

type DurationBadgeProps = {
  durationSeconds: number
  className?: string
}

export function DurationBadge({
  durationSeconds,
  className
}: DurationBadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'rounded-md bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400 tabular-nums',
        className
      )}
    >
      {formatDuration(durationSeconds)}
    </span>
  )
}
