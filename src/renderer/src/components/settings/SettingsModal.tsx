import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { SettingsSidebar } from '@renderer/components/settings/SettingsSidebar'
import { AboutPanel } from '@renderer/components/settings/panels/AboutPanel'
import { AIProvidersPanel } from '@renderer/components/settings/panels/AIProvidersPanel'
import { AudioPanel } from '@renderer/components/settings/panels/AudioPanel'
import { KeybindsPanel } from '@renderer/components/settings/panels/KeybindsPanel'
import { cn } from '@renderer/lib/utils'
import { useSettingsStore, type SettingsSection } from '@renderer/stores/settingsStore'

function SettingsContent({ section }: { section: SettingsSection }) {
  switch (section) {
    case 'audio':
      return <AudioPanel />
    case 'aiProviders':
      return <AIProvidersPanel />
    case 'keybinds':
      return <KeybindsPanel />
    case 'about':
      return <AboutPanel />
  }
}

export function SettingsModal() {
  const isOpen = useSettingsStore((state) => state.isOpen)
  const activeSection = useSettingsStore((state) => state.activeSection)
  const closeSettings = useSettingsStore((state) => state.closeSettings)

  return (
    <Dialog open={isOpen} onClose={closeSettings} className="relative z-50">
      <DialogBackdrop
        transition
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm',
          'transition-opacity data-closed:opacity-0'
        )}
      />

      <div className="fixed inset-0 flex items-center justify-center p-6">
        <DialogPanel
          transition
          className={cn(
            'flex h-[520px] w-full max-w-4xl overflow-hidden rounded-2xl',
            'border border-neutral-800 bg-neutral-950',
            'transition-opacity data-closed:opacity-0'
          )}
        >
          <SettingsSidebar />
          <div className="flex-1 overflow-y-auto p-6">
            <SettingsContent section={activeSection} />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
