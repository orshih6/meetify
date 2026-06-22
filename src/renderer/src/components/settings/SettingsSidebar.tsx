import { SettingsSectionButton } from '@renderer/components/settings/SettingsSectionButton'
import { SETTINGS_NAV_ITEMS } from '@renderer/components/settings/settingsNav'
import { controlFocus, fieldLabel, surfaceBorder } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { Button } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/16/solid'

export function SettingsSidebar() {
  const activeSection = useSettingsStore((state) => state.activeSection)
  const setActiveSection = useSettingsStore((state) => state.setActiveSection)
  const closeSettings = useSettingsStore((state) => state.closeSettings)

  return (
    <aside className={cn('flex w-52 shrink-0 flex-col border-r p-3', surfaceBorder)}>
      <p className={cn('px-2', fieldLabel)}>Settings</p>

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
            'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-neutral-500',
            'transition-colors hover:text-white',
            controlFocus
          )}
        >
          <XMarkIcon className="h-4 w-4" />
          Close
        </Button>
      </div>
    </aside>
  )
}
