import { desktopCapturer, session } from 'electron'

export function registerDisplayMediaHandler(): void {
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer
      .getSources({ types: ['screen'] })
      .then((sources) => {
        const source = sources[0]

        if (!source) {
          callback({})
          return
        }

        callback({
          video: source,
          audio: 'loopback'
        })
      })
      .catch(() => {
        callback({})
      })
  })
}
