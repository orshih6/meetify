import { SettingsSecretField } from '@renderer/components/settings/SettingsSecretField'
import { panelDesc, panelTitle } from '@renderer/lib/uiClasses'
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
      <h2 className={panelTitle}>AI Providers</h2>
      <p className={panelDesc}>
        Configure the OpenAI API key used for transcription and meeting summaries.
      </p>

      <div className="mt-5">
        <SettingsSecretField
          label="OpenAI API Key"
          statusLabel={apiKeyStatusLabel(apiKeyStatus.source, apiKeyStatus.configured)}
          placeholder="sk-..."
          onSave={saveOpenAiApiKey}
          onClear={clearOpenAiApiKey}
        />
      </div>
    </div>
  )
}
