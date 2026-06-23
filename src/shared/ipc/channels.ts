export const IPC_CHANNELS = {
  recording: {
    requestMicPermission: 'recording:request-mic-permission'
  },
  session: {
    save: 'session:save',
    list: 'session:list',
    load: 'session:load',
    delete: 'session:delete'
  },
  summary: {
    generate: 'summary:generate'
  },
  title: {
    generate: 'title:generate'
  },
  transcription: {
    start: 'transcription:start',
    stop: 'transcription:stop',
    audio: 'transcription:audio',
    delta: 'transcription:delta',
    utterance: 'transcription:utterance',
    error: 'transcription:error',
    closed: 'transcription:closed'
  },
  settings: {
    get: 'settings:get',
    set: 'settings:set'
  },
  credentials: {
    getStatus: 'credentials:get-status',
    setOpenAiApiKey: 'credentials:set-openai-api-key',
    clearOpenAiApiKey: 'credentials:clear-openai-api-key'
  },
  app: {
    getVersion: 'app:get-version'
  },
  shortcut: {
    openSettings: 'shortcut:open-settings',
    startRecording: 'shortcut:start-recording',
    stopRecording: 'shortcut:stop-recording'
  }
} as const
