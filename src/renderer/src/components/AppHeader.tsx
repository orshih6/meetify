import { Button } from '@headlessui/react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  Squares2X2Icon
} from '@heroicons/react/16/solid'
import { cn } from '@renderer/lib/utils'
import { useCanGoBack, useCanGoForward, useNavigationStore } from '@renderer/stores/navigationStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'

const isMac = window.api.platform === 'darwin'

export function AppHeader(): React.JSX.Element {
  const canGoBack = useCanGoBack()
  const canGoForward = useCanGoForward()
  const goBack = useNavigationStore((state) => state.goBack)
  const goForward = useNavigationStore((state) => state.goForward)
  const openSettings = useSettingsStore((state) => state.openSettings)

  return (
    <header
      className={cn(
        'app-header-drag flex h-12 shrink-0 items-center justify-between',
        'border-b border-neutral-900/50 bg-black px-4'
      )}
    >
      <div className={cn('app-header-no-drag flex items-center gap-0.5', isMac && 'pl-[72px]')}>
        <Button
          onClick={goBack}
          disabled={!canGoBack}
          className={cn(
            'rounded p-2 transition-colors',
            canGoBack ? 'text-neutral-400 hover:text-white' : 'cursor-default text-neutral-700',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600 disabled:opacity-100'
          )}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          onClick={goForward}
          disabled={!canGoForward}
          className={cn(
            'rounded p-2 transition-colors',
            canGoForward ? 'text-neutral-400 hover:text-white' : 'cursor-default text-neutral-700',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600 disabled:opacity-100'
          )}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="app-header-no-drag flex items-center gap-1 pr-1">
        <Button
          className={cn(
            'rounded p-2 text-neutral-400 transition-colors hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
          )}
        >
          <Squares2X2Icon className="h-4 w-4" />
        </Button>
        <Button
          onClick={openSettings}
          className={cn(
            'rounded p-2 text-neutral-400 transition-colors hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
          )}
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
