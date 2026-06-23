import { cn } from '@renderer/lib/utils'
import { useToastStore } from '@renderer/stores/toastStore'

export function Toast() {
  const message = useToastStore((state) => state.message)

  if (!message) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <p
        className={cn(
          'bg-graphite rounded-full border border-neutral-800 px-4 py-2',
          'text-ink text-sm shadow-lg'
        )}
      >
        {message}
      </p>
    </div>
  )
}
