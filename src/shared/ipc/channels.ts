export const IPC_CHANNELS = {
  recording: {
    requestMicPermission: 'recording:request-mic-permission',
    save: 'recording:save'
  },
  session: {
    save: 'session:save',
    list: 'session:list',
    load: 'session:load'
  },
  summary: {
    generate: 'summary:generate'
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
  }
} as const
