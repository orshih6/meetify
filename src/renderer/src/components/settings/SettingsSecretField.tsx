import { Button } from '@headlessui/react'
import { controlFocus, controlInput, fieldLabel } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'
import { useState } from 'react'

type SettingsSecretFieldProps = {
  label: string
  statusLabel: string
  placeholder?: string
  saveLabel?: string
  clearLabel?: string
  onSave: (value: string) => Promise<void>
  onClear: () => Promise<void>
  disabled?: boolean
}

export function SettingsSecretField({
  label,
  statusLabel,
  placeholder = 'Enter API key',
  saveLabel = 'Save',
  clearLabel = 'Clear',
  onSave,
  onClear,
  disabled = false
}: SettingsSecretFieldProps) {
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  async function handleSave(): Promise<void> {
    if (!value.trim() || disabled) {
      return
    }

    setIsSaving(true)

    try {
      await onSave(value.trim())
      setValue('')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleClear(): Promise<void> {
    if (disabled) {
      return
    }

    setIsClearing(true)

    try {
      await onClear()
      setValue('')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className={fieldLabel}>{label}</p>
        <span className="text-xs text-neutral-500">{statusLabel}</span>
      </div>

      <input
        type="password"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        disabled={disabled || isSaving || isClearing}
        autoComplete="off"
        className={cn(
          'w-full placeholder:text-neutral-500',
          controlInput,
          controlFocus,
          (disabled || isSaving || isClearing) && 'cursor-not-allowed opacity-50'
        )}
      />

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={disabled || isSaving || isClearing || !value.trim()}
          className={cn(
            'rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black',
            'transition-opacity hover:opacity-90',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          {isSaving ? 'Saving…' : saveLabel}
        </Button>
        <Button
          type="button"
          onClick={() => void handleClear()}
          disabled={disabled || isSaving || isClearing}
          className={cn(
            'rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300',
            'transition-colors hover:border-neutral-700 hover:text-white',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          {isClearing ? 'Clearing…' : clearLabel}
        </Button>
      </div>
    </div>
  )
}
