import { cn } from '@renderer/lib/utils'

export const panelTitle = 'text-base font-semibold text-ink'

export const panelDesc = 'text-ash mt-1 text-xs'

export const fieldLabel = 'text-ash text-xs font-medium tracking-wider uppercase'

export const surfaceBorder = 'border-neutral-900/80'

export const surfaceMuted = 'bg-graphite/40'

export const controlInput = cn(
  'rounded-lg border border-neutral-800 bg-graphite px-3 py-2 text-sm text-ink'
)

export const controlFocus = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60'

export const recordButtonIdle = cn(
  'border border-neutral-700 text-ink hover:border-neutral-600 hover:bg-graphite'
)

export const recordButtonLive = cn(
  'bg-red-600 text-white shadow-[0_0_24px_rgba(79,209,197,0.25)] hover:bg-red-500'
)
