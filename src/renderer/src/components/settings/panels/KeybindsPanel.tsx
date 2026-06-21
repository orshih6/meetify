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
      <h2 className="text-xl font-semibold text-white">Keybinds</h2>
      <p className="mt-1 text-sm text-neutral-500">Keyboard shortcuts for common actions.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-800">
        {KEYBINDS.map((keybind, index) => (
          <div
            key={keybind.action}
            className={cn(
              'flex items-center justify-between px-4 py-3',
              index !== KEYBINDS.length - 1 && 'border-b border-neutral-800'
            )}
          >
            <span className="text-sm text-neutral-300">{keybind.action}</span>
            <span className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs text-neutral-400">
              {keybind.keys}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
