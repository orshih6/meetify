import { panelDesc, panelTitle, surfaceBorder, surfaceMuted } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'
import { useEffect, useState } from 'react'

export function AboutPanel() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    void window.api.app.getVersion().then(setVersion)
  }, [])

  return (
    <div>
      <h2 className={panelTitle}>About</h2>
      <p className={panelDesc}>Meetify meeting notes application.</p>

      <div className={cn('mt-5 rounded-xl border p-5', surfaceBorder, surfaceMuted)}>
        <p className="font-display text-ink text-2xl">Meetify</p>
        <p className="text-ash mt-1 font-mono text-xs">Version {version ?? '…'}</p>
        <p className="text-ash mt-4 text-sm leading-relaxed">
          Capture, transcribe, and summarize your meetings in one place.
        </p>
      </div>
    </div>
  )
}
