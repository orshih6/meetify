import { SettingsField } from '@renderer/components/settings/SettingsField'
import { panelDesc, panelTitle, surfaceBorder, surfaceMuted } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'
import {
  LANGUAGE_SETTING_OPTIONS,
  SPEECH_PROVIDER_OPTIONS,
  useSettingsStore
} from '@renderer/stores/settingsStore'
import { InformationCircleIcon } from '@heroicons/react/16/solid'

export function AudioPanel() {
  const language = useSettingsStore((state) => state.language)
  const setLanguage = useSettingsStore((state) => state.setLanguage)
  const selectedLanguageLabel =
    LANGUAGE_SETTING_OPTIONS.find((option) => option.value === language)?.label ?? 'English'

  return (
    <div className="space-y-6">
      <section>
        <h2 className={panelTitle}>Speech Provider</h2>
        <p className={panelDesc}>Choose the engine that transcribes audio to text.</p>
        <SettingsField
          label="Speech Provider"
          options={SPEECH_PROVIDER_OPTIONS.map((option) => option.label)}
          value={
            SPEECH_PROVIDER_OPTIONS.find((option) => option.enabled)?.label ?? 'OpenAI Realtime'
          }
          disabled
          className="mt-4"
        />
      </section>

      <section className={cn('rounded-xl border p-4', surfaceBorder, surfaceMuted)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Language"
            options={LANGUAGE_SETTING_OPTIONS.map((option) => option.label)}
            value={selectedLanguageLabel}
            onChange={(label) => {
              const match = LANGUAGE_SETTING_OPTIONS.find((option) => option.label === label)
              if (match) {
                void setLanguage(match.value)
              }
            }}
          />
          <SettingsField
            label="Accent / Region"
            options={['United States', 'United Kingdom', 'Australia', 'Canada']}
            defaultValue="United States"
            disabled
          />
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-neutral-600">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          Select the primary language being spoken in the meeting.
        </p>
      </section>

      <section>
        <h2 className={panelTitle}>Audio Configuration</h2>
        <p className={panelDesc}>Manage input and output devices.</p>
        <SettingsField
          label="Input Device"
          options={['Default Microphone', 'MacBook Pro Microphone', 'External USB Mic']}
          placeholder="Select Device"
          disabled
          className="mt-4"
        />
      </section>
    </div>
  )
}
