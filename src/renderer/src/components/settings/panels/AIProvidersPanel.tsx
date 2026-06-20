import { SettingsField } from '@renderer/components/settings/SettingsField'

export function AIProvidersPanel(): React.JSX.Element {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">AI Providers</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Configure the AI models used for summaries and meeting insights.
      </p>

      <div className="mt-6 space-y-4">
        <SettingsField
          label="Summary Provider"
          options={['OpenAI', 'Anthropic', 'Google Gemini']}
          placeholder="Select Provider"
        />
        <SettingsField
          label="Model"
          options={['GPT-4o', 'Claude Sonnet', 'Gemini Pro']}
          placeholder="Select Model"
        />
      </div>
    </div>
  )
}
