import { Button } from '@headlessui/react'
import type { SettingsNavItem } from '@renderer/components/settings/settingsNav'
import { controlFocus } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'

type SettingsSectionButtonProps = {
  item: SettingsNavItem
  isActive: boolean
  onSelect: () => void
}

export function SettingsSectionButton({ item, isActive, onSelect }: SettingsSectionButtonProps) {
  const Icon = item.icon

  return (
    <Button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm',
        isActive ? 'bg-neutral-900/60 text-neutral-100' : 'text-neutral-500 hover:text-white',
        controlFocus
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Button>
  )
}
