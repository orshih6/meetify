import { SettingsField } from '@renderer/components/settings/SettingsField'
import { InformationCircleIcon } from '@heroicons/react/16/solid'

export function AudioPanel() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-white">Speech Provider</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Choose the engine that transcribes audio to text.
        </p>
        <SettingsField
          label="Speech Provider"
          options={['Whisper', 'Deepgram', 'AssemblyAI']}
          placeholder="Select Provider"
          className="mt-4"
        />
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Language"
            options={['English', 'Spanish', 'French', 'German']}
            defaultValue="English"
          />
          <SettingsField
            label="Accent / Region"
            options={['United States', 'United Kingdom', 'Australia', 'Canada']}
            defaultValue="United States"
          />
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          Select the primary language being spoken in the meeting.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Audio Configuration</h2>
        <p className="mt-1 text-sm text-neutral-500">Manage input and output devices.</p>
        <SettingsField
          label="Input Device"
          options={['Default Microphone', 'MacBook Pro Microphone', 'External USB Mic']}
          placeholder="Select Device"
          className="mt-4"
        />
      </section>
    </div>
  )
}
