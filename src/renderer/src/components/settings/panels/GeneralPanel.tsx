import { SettingsField } from '@renderer/components/settings/SettingsField'

export function GeneralPanel(): React.JSX.Element {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">General</h2>
      <p className="mt-1 text-sm text-neutral-500">Manage your Meetify preferences.</p>

      <div className="mt-6 space-y-4">
        <SettingsField
          label="Theme"
          options={['Dark', 'Light', 'System']}
          defaultValue="Dark"
        />
        <SettingsField
          label="Language"
          options={['English', 'Spanish', 'French']}
          defaultValue="English"
        />
      </div>
    </div>
  )
}
