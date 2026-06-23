import { Button } from '@headlessui/react'
import { ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon } from '@heroicons/react/16/solid'
import { cn } from '@renderer/lib/utils'
import {
  useCanGoBack,
  useCanGoForward,
  useSessionNavigationStore
} from '@renderer/stores/sessionNavigationStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import type { ComponentType, SVGProps } from 'react'

const IS_MAC = window.api?.platform === 'darwin'

const iconButtonClass = cn(
  'rounded p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
)

type NavIconButtonProps = {
  onClick: () => void
  disabled: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

function NavIconButton({ onClick, disabled, icon: Icon }: NavIconButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        iconButtonClass,
        disabled ? 'cursor-default text-neutral-700' : 'text-neutral-400 hover:text-white',
        'disabled:opacity-100'
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export function AppHeader() {
  const canGoBack = useCanGoBack()
  const canGoForward = useCanGoForward()
  const goBack = useSessionNavigationStore((state) => state.goBack)
  const goForward = useSessionNavigationStore((state) => state.goForward)
  const openSettings = useSettingsStore((state) => state.openSettings)

  return (
    <header
      className={cn(
        'app-header-drag bg-void flex h-12 shrink-0 items-center justify-between',
        'border-b border-neutral-900/80 px-4'
      )}
    >
      <div className={cn('app-header-no-drag flex items-center gap-0.5', IS_MAC && 'pl-[72px]')}>
        <NavIconButton onClick={goBack} disabled={!canGoBack} icon={ChevronLeftIcon} />
        <NavIconButton onClick={goForward} disabled={!canGoForward} icon={ChevronRightIcon} />
      </div>

      <div className="app-header-no-drag flex items-center gap-1 pr-1">
        <Button
          onClick={openSettings}
          className={cn(iconButtonClass, 'text-neutral-400 hover:text-white')}
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
