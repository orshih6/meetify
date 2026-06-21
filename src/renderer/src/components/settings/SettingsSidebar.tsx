import { SettingsSectionButton } from '@renderer/components/settings/SettingsSectionButton'
import { SETTINGS_NAV_ITEMS } from '@renderer/components/settings/settingsNav'
import { cn } from '@renderer/lib/utils'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { Button } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/16/solid'

export function SettingsSidebar() {
  const activeSection = useSettingsStore((state) => state.activeSection)
  const setActiveSection = useSettingsStore((state) => state.setActiveSection)
  const closeSettings = useSettingsStore((state) => state.closeSettings)

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-neutral-800 p-3">
      <p className="px-2 text-xs tracking-wide text-neutral-500 uppercase">Settings</p>

      <nav className="mt-3 flex flex-col gap-0.5">
        {SETTINGS_NAV_ITEMS.map((item) => (
          <SettingsSectionButton
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onSelect={() => setActiveSection(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto pt-4">
        <Button
          onClick={closeSettings}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-400',
            'transition-colors hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
          )}
        >
          <XMarkIcon className="h-4 w-4" />
          Close
        </Button>
      </div>
    </aside>
  )
}
