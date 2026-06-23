import { SettingsField } from '@renderer/components/settings/SettingsField'
import { panelDesc, panelTitle, surfaceBorder, surfaceMuted } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'
import {
  getInputDeviceLabel,
  LANGUAGE_SETTING_OPTIONS,
  useSettingsStore
} from '@renderer/stores/settingsStore'
import { InformationCircleIcon } from '@heroicons/react/16/solid'

const DEFAULT_DEVICE_OPTION = 'System default'

export function AudioPanel() {
  const language = useSettingsStore((state) => state.language)
  const inputDeviceId = useSettingsStore((state) => state.inputDeviceId)
  const audioInputDevices = useSettingsStore((state) => state.audioInputDevices)
  const setLanguage = useSettingsStore((state) => state.setLanguage)
  const setInputDevice = useSettingsStore((state) => state.setInputDevice)
  const selectedLanguageLabel =
    LANGUAGE_SETTING_OPTIONS.find((option) => option.value === language)?.label ?? 'English'

  const deviceOptions = [DEFAULT_DEVICE_OPTION, ...audioInputDevices.map((device) => device.label)]
  const selectedDeviceLabel = getInputDeviceLabel(audioInputDevices, inputDeviceId)

  return (
    <div className="space-y-6">
      <section className={cn('rounded-xl border p-4', surfaceBorder, surfaceMuted)}>
        <h2 className={panelTitle}>Language</h2>
        <p className={panelDesc}>Primary language spoken in meetings.</p>
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
          className="mt-4"
        />
        <p className="text-ash mt-4 flex items-start gap-2 text-xs">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          Used for real-time transcription accuracy.
        </p>
      </section>

      <section>
        <h2 className={panelTitle}>Input device</h2>
        <p className={panelDesc}>Microphone used when recording.</p>
        <SettingsField
          label="Microphone"
          options={deviceOptions}
          value={selectedDeviceLabel}
          onChange={(label) => {
            if (label === DEFAULT_DEVICE_OPTION) {
              void setInputDevice(null)
              return
            }

            const match = audioInputDevices.find((device) => device.label === label)
            if (match) {
              void setInputDevice(match.deviceId)
            }
          }}
          className="mt-4"
        />
      </section>
    </div>
  )
}
