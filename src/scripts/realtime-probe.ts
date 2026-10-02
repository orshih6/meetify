/**
 * Manual OpenAI Realtime transcription probe (mic or silence).
 *
 * pnpm probe:mic
 * pnpm probe:ws
 *
 * API key: set OPENAI_API_KEY in .env (same as dev) — never pass it on the command line.
 * Requires ffmpeg on PATH for --source mic.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { loadEnvFile } from '../shared/loadEnvFile'
import { createRealtimeTranscription } from './lib/runRealtimeTranscription'

type ProbeSource = 'mic' | 'silence'

type ProbeOptions = {
  source: ProbeSource
  seconds: number
  language: string
  device: string
}

const PCM_CHUNK_BYTES = 8192
const SILENCE_CHUNK_INTERVAL_MS = 100
const SILENCE_CHUNK_SAMPLES = 2400

function parseArgs(argv: string[]): ProbeOptions {
  let source: ProbeSource = 'silence'
  let seconds = 30
  let language = process.env.TRANSCRIPTION_LANGUAGE ?? 'en'
  let device = ':0'

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--source' && argv[i + 1]) {
      const value = argv[++i]

      if (value === 'mic' || value === 'silence') {
        source = value
      } else {
        throw new Error(`Unknown --source value: ${value}`)
      }
    } else if (arg === '--seconds' && argv[i + 1]) {
      seconds = Number(argv[++i])

      if (!Number.isFinite(seconds) || seconds <= 0) {
        throw new Error('--seconds must be a positive number')
      }
    } else if (arg === '--language' && argv[i + 1]) {
      language = argv[++i]
    } else if (arg === '--device' && argv[i + 1]) {
      device = argv[++i]
    }
  }

  return { source, seconds, language, device }
}

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      'OpenAI API key not configured. Add OPENAI_API_KEY to .env (see .env.example).'
    )
  }

  return apiKey
}

function spawnFfmpeg(device: string): ChildProcessWithoutNullStreams {
  return spawn(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-f', 'avfoundation', '-i', device, '-ar', '24000', '-ac', '1', '-f', 's16le', '-'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
}

async function runMicProbe(
  session: ReturnType<typeof createRealtimeTranscription>,
  options: ProbeOptions
): Promise<void> {
  const ffmpeg = spawnFfmpeg(options.device)
  let stderr = ''

  ffmpeg.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString()
  })

  ffmpeg.on('error', (error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('[error] ffmpeg not found on PATH. Install ffmpeg or use --source silence.')
    } else {
      console.error(`[error] ffmpeg failed: ${error.message}`)
    }
  })

  ffmpeg.stdout.on('data', (chunk: Buffer) => {
    session.feedPcm(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength))
  })

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      ffmpeg.kill('SIGTERM')
      resolve()
    }, options.seconds * 1000)

    const shutdown = (): void => {
      clearTimeout(timer)
      ffmpeg.kill('SIGTERM')
      resolve()
    }

    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)

    ffmpeg.on('close', (code) => {
      clearTimeout(timer)

      if (code !== 0 && code !== null && stderr.trim()) {
        console.error(`[error] ffmpeg exited (${code}): ${stderr.trim()}`)
      }

      resolve()
    })
  })
}

async function runSilenceProbe(
  session: ReturnType<typeof createRealtimeTranscription>,
  options: ProbeOptions
): Promise<void> {
  const chunk = new Uint8Array(SILENCE_CHUNK_SAMPLES * 2)
  const startedAt = Date.now()

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      session.feedPcm(chunk)

      if (Date.now() - startedAt >= options.seconds * 1000) {
        clearInterval(interval)
        resolve()
      }
    }, SILENCE_CHUNK_INTERVAL_MS)

    const shutdown = (): void => {
      clearInterval(interval)
      resolve()
    }

    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  })
}

async function main(): Promise<void> {
  loadEnvFile()
  const options = parseArgs(process.argv.slice(2))
  const apiKey = getApiKey()

  console.log(`[probe] source=${options.source} seconds=${options.seconds} language=${options.language}`)

  const session = createRealtimeTranscription({
    apiKey,
    language: options.language,
    onReady: (eventType) => {
      console.log(`[ready] ${eventType}`)
    },
    onDelta: (delta) => {
      process.stdout.write(`[delta] ${delta}`)
    },
    onUtterance: (text, itemId) => {
      console.log(`\n[utterance] (${itemId}) ${text}`)
    },
    onError: (message) => {
      console.error(`[error] ${message}`)
    }
  })

  await session.start()

  if (options.source === 'mic') {
    console.log(`[probe] recording mic via ffmpeg (device ${options.device}) — speak now`)
    await runMicProbe(session, options)
  } else {
    console.log('[probe] streaming silence — WS connectivity check')
    await runSilenceProbe(session, options)
  }

  session.stop()
  console.log('[probe] done')
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[error] ${message}`)
  process.exit(1)
})
