import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { controlFocus, controlInput, fieldLabel } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'

type SettingsFieldProps = {
  label: string
  options: string[]
  value?: string
  defaultValue?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  onChange?: (value: string) => void
}

export function SettingsField({
  label,
  options,
  value,
  defaultValue,
  placeholder = 'Select',
  className,
  disabled = false,
  onChange
}: SettingsFieldProps) {
  const selected = value ?? defaultValue ?? ''

  return (
    <div className={className}>
      <p className={cn('mb-2', fieldLabel)}>{label}</p>
      <Listbox value={selected} onChange={(next) => onChange?.(next)} disabled={disabled}>
        <div className="relative">
          <ListboxButton
            className={cn(
              'flex w-full items-center justify-between',
              controlInput,
              controlFocus,
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <span className={selected ? 'text-white' : 'text-neutral-500'}>
              {selected || placeholder}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-neutral-500" />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom start"
            className={cn(
              'z-50 mt-1 max-h-48 w-[var(--button-width)] overflow-auto rounded-lg',
              'border border-neutral-800 bg-neutral-900 py-1 shadow-lg',
              'focus:outline-none'
            )}
          >
            {options.map((option) => (
              <ListboxOption
                key={option}
                value={option}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm text-neutral-300',
                  'data-focus:bg-neutral-800 data-selected:text-white'
                )}
              >
                {option}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  )
}
