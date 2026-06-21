import { Button } from '@headlessui/react'
import type { SettingsNavItem } from '@renderer/components/settings/settingsNav'
import { cn } from '@renderer/lib/utils'

type SettingsSectionButtonProps = {
  item: SettingsNavItem
  isActive: boolean
  onSelect: () => void
}

export function SettingsSectionButton({
  item,
  isActive,
  onSelect
}: SettingsSectionButtonProps) {
  const Icon = item.icon

  return (
    <Button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm',
        isActive ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Button>
  )
}
