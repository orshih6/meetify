import { SettingsField } from '@renderer/components/settings/SettingsField'
import { SettingsSecretField } from '@renderer/components/settings/SettingsSecretField'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useEffect } from 'react'

function apiKeyStatusLabel(source: 'settings' | 'env' | 'none', configured: boolean): string {
  if (source === 'settings' && configured) {
    return 'Configured (saved)'
  }

  if (source === 'env' && configured) {
    return 'Using .env'
  }

  return 'Not configured'
}

export function AIProvidersPanel() {
  const apiKeyStatus = useSettingsStore((state) => state.apiKeyStatus)
  const loadApiKeyStatus = useSettingsStore((state) => state.loadApiKeyStatus)
  const saveOpenAiApiKey = useSettingsStore((state) => state.saveOpenAiApiKey)
  const clearOpenAiApiKey = useSettingsStore((state) => state.clearOpenAiApiKey)

  useEffect(() => {
    void loadApiKeyStatus()
  }, [loadApiKeyStatus])

  return (
    <div>
      <h2 className="text-xl font-semibold text-white">AI Providers</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Configure the AI models used for summaries and meeting insights.
      </p>

      <div className="mt-6 space-y-4">
        <SettingsSecretField
          label="OpenAI API Key"
          statusLabel={apiKeyStatusLabel(apiKeyStatus.source, apiKeyStatus.configured)}
          placeholder="sk-..."
          onSave={saveOpenAiApiKey}
          onClear={clearOpenAiApiKey}
        />
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
