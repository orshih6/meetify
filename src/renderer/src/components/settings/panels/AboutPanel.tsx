import { panelDesc, panelTitle, surfaceBorder, surfaceMuted } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'

export function AboutPanel() {
  return (
    <div>
      <h2 className={panelTitle}>About</h2>
      <p className={panelDesc}>Meetify meeting notes application.</p>

      <div className={cn('mt-5 rounded-xl border p-4', surfaceBorder, surfaceMuted)}>
        <p className="text-sm text-neutral-400">Meetify</p>
        <p className="mt-1 text-xs text-neutral-600">Version 1.0.0</p>
        <p className="mt-4 text-sm text-neutral-400">
          Capture, transcribe, and summarize your meetings in one place.
        </p>
      </div>
    </div>
  )
}
