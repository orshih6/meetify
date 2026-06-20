import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { cn } from '@renderer/lib/utils'
import { useState } from 'react'

type SettingsFieldProps = {
  label: string
  options: string[]
  defaultValue?: string
  placeholder?: string
  className?: string
}

export function SettingsField({
  label,
  options,
  defaultValue,
  placeholder = 'Select',
  className
}: SettingsFieldProps): React.JSX.Element {
  const [selected, setSelected] = useState(defaultValue ?? '')

  return (
    <div className={className}>
      <p className="mb-2 text-xs tracking-wide text-neutral-500 uppercase">{label}</p>
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <ListboxButton
            className={cn(
              'flex w-full items-center justify-between rounded-lg border border-neutral-800',
              'bg-neutral-900 px-3 py-2.5 text-sm text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600'
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
