export const IPC_CHANNELS = {
  recording: {
    requestMicPermission: 'recording:request-mic-permission',
    save: 'recording:save'
  },
  transcript: {
    save: 'transcript:save',
    list: 'transcript:list',
    load: 'transcript:load'
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
  }
} as const
