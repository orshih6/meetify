export type RecordingApi = Window['api']

export function createDefaultRecordingApi(): RecordingApi {
  return window.api
}
