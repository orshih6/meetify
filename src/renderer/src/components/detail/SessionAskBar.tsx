import { Button } from '@headlessui/react'
import { ArrowUpIcon } from '@heroicons/react/16/solid'
import { cn } from '@renderer/lib/utils'
import { useDetailStore } from '@renderer/stores/detailStore'
import { useSelectedSession } from '@renderer/stores/sessionsStore'

export function SessionAskBar(): React.JSX.Element {
  const session = useSelectedSession()
  const askQuery = useDetailStore((state) => state.askQuery)
  const setAskQuery = useDetailStore((state) => state.setAskQuery)
  const submitAskQuery = useDetailStore((state) => state.submitAskQuery)

  if (!session) {
    return <></>
  }

  return (
    <div className="fixed right-0 bottom-6 left-0 px-6">
      <div
        className={cn(
          'mx-auto flex max-w-2xl items-center gap-3 rounded-full',
          'border border-neutral-800 bg-neutral-950 px-5 py-3'
        )}
      >
        <input
          type="text"
          value={askQuery}
          onChange={(event) => setAskQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              submitAskQuery(session.id)
            }
          }}
          placeholder="Ask about this meeting..."
          className={cn(
            'min-w-0 flex-1 bg-transparent text-sm text-white outline-none',
            'placeholder:text-neutral-500'
          )}
        />
        <Button
          onClick={() => submitAskQuery(session.id)}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            'bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
          )}
        >
          <ArrowUpIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
