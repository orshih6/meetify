import { panelDesc, panelTitle, surfaceBorder } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'

const KEYBINDS = [
  { action: 'Open settings', keys: 'Cmd + ,' },
  { action: 'Start recording', keys: 'Cmd + R' },
  { action: 'Stop recording', keys: 'Cmd + Shift + R' },
  { action: 'Ask about meeting', keys: 'Cmd + K' }
]

export function KeybindsPanel() {
  return (
    <div>
      <h2 className={panelTitle}>Keybinds</h2>
      <p className={panelDesc}>Keyboard shortcuts for common actions.</p>

      <div className={cn('mt-5 overflow-hidden rounded-xl border', surfaceBorder)}>
        {KEYBINDS.map((keybind, index) => (
          <div
            key={keybind.action}
            className={cn(
              'flex items-center justify-between px-4 py-2.5',
              index !== KEYBINDS.length - 1 && 'border-b border-neutral-900/80'
            )}
          >
            <span className="text-sm text-neutral-400">{keybind.action}</span>
            <span className="rounded-md border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-xs text-neutral-500">
              {keybind.keys}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
