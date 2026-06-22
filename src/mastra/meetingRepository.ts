import { randomUUID } from 'node:crypto'
import type { MastraDBMessage } from '@mastra/core/agent'
import type { MemoryStorage } from '@mastra/core/storage'
import type {
  SavedSessionTranscript,
  SavedTranscriptEntry,
  SessionListEntry,
  SessionLoadResult,
  SummaryStatus
} from '@shared/ipc'
import { MEETIFY_RESOURCE_ID } from './storage'

type MeetingThreadMetadata = {
  startedAt: string
  durationSeconds: number
  summaryStatus?: SummaryStatus
  summary?: string
}

const UNTITLED_SESSION_TITLE = 'Untitled'

function formatSessionTitle(): string {
  return UNTITLED_SESSION_TITLE
}

function parseThreadMetadata(metadata: Record<string, unknown> | undefined): MeetingThreadMetadata {
  const startedAt = typeof metadata?.startedAt === 'string' ? metadata.startedAt : new Date().toISOString()
  const durationSeconds =
    typeof metadata?.durationSeconds === 'number' ? metadata.durationSeconds : 0
  const summaryStatus =
    metadata?.summaryStatus === 'processing' ||
    metadata?.summaryStatus === 'ready' ||
    metadata?.summaryStatus === 'error'
      ? metadata.summaryStatus
      : undefined
  const summary = typeof metadata?.summary === 'string' ? metadata.summary : undefined

  return { startedAt, durationSeconds, summaryStatus, summary }
}

function transcriptEntryToMessage(
  entry: SavedTranscriptEntry,
  threadId: string,
  startedAt: string
): MastraDBMessage {
  const startedAtMs = new Date(startedAt).getTime()

  return {
    id: randomUUID(),
    role: 'user',
    threadId,
    resourceId: MEETIFY_RESOURCE_ID,
    createdAt: new Date(startedAtMs + entry.elapsedSeconds * 1000),
    content: {
      format: 2,
      parts: [{ type: 'text', text: entry.text }],
      metadata: {
        speaker: entry.speaker,
        time: entry.time,
        elapsedSeconds: entry.elapsedSeconds
      }
    }
  }
}

function messageToTranscriptEntry(message: MastraDBMessage): SavedTranscriptEntry {
  const metadata = message.content.metadata ?? {}
  const speaker = typeof metadata.speaker === 'string' ? metadata.speaker : 'Unknown'
  const time = typeof metadata.time === 'string' ? metadata.time : ''
  const elapsedSeconds =
    typeof metadata.elapsedSeconds === 'number' ? metadata.elapsedSeconds : 0
  const textPart = message.content.parts.find((part) => part.type === 'text')
  const text = textPart && 'text' in textPart ? textPart.text : ''

  return { speaker, time, text, elapsedSeconds }
}

export async function saveMeetingSession(
  memory: MemoryStorage,
  payload: SavedSessionTranscript
): Promise<string> {
  const sessionId = randomUUID()
  const now = new Date()
  const title = formatSessionTitle()
  const metadata: MeetingThreadMetadata = {
    startedAt: payload.startedAt,
    durationSeconds: payload.durationSeconds,
    summaryStatus: 'processing'
  }

  await memory.saveThread({
    thread: {
      id: sessionId,
      resourceId: MEETIFY_RESOURCE_ID,
      title,
      createdAt: now,
      updatedAt: now,
      metadata
    }
  })

  if (payload.transcript.length > 0) {
    const messages = payload.transcript.map((entry) =>
      transcriptEntryToMessage(entry, sessionId, payload.startedAt)
    )

    await memory.saveMessages({ messages })
  }

  return sessionId
}

export async function listMeetingSessions(memory: MemoryStorage): Promise<SessionListEntry[]> {
  const { threads } = await memory.listThreads({
    filter: { resourceId: MEETIFY_RESOURCE_ID },
    perPage: false,
    orderBy: { field: 'createdAt', direction: 'DESC' }
  })

  return threads.map((thread) => {
    const meta = parseThreadMetadata(thread.metadata)

    return {
      sessionId: thread.id,
      title: thread.title ?? formatSessionTitle(),
      startedAt: meta.startedAt,
      durationSeconds: meta.durationSeconds,
      summaryStatus: meta.summaryStatus ?? (meta.summary ? 'ready' : 'processing')
    }
  })
}

export async function loadMeetingSession(
  memory: MemoryStorage,
  sessionId: string
): Promise<SessionLoadResult | null> {
  const thread = await memory.getThreadById({ threadId: sessionId, resourceId: MEETIFY_RESOURCE_ID })

  if (!thread) {
    return null
  }

  const meta = parseThreadMetadata(thread.metadata)
  const { messages } = await memory.listMessages({
    threadId: sessionId,
    resourceId: MEETIFY_RESOURCE_ID,
    perPage: false,
    orderBy: { field: 'createdAt', direction: 'ASC' }
  })

  const transcript = messages
    .map(messageToTranscriptEntry)
    .toSorted((a, b) => a.elapsedSeconds - b.elapsedSeconds)

  return {
    sessionId: thread.id,
    title: thread.title ?? formatSessionTitle(),
    startedAt: meta.startedAt,
    durationSeconds: meta.durationSeconds,
    transcript,
    summary: meta.summary,
    summaryStatus: meta.summaryStatus
  }
}

async function updateThreadMetadata(
  memory: MemoryStorage,
  sessionId: string,
  patch: Partial<MeetingThreadMetadata>
): Promise<void> {
  const thread = await memory.getThreadById({ threadId: sessionId, resourceId: MEETIFY_RESOURCE_ID })

  if (!thread) {
    throw new Error(`Meeting session not found: ${sessionId}`)
  }

  const current = parseThreadMetadata(thread.metadata)
  const nextMetadata: MeetingThreadMetadata = { ...current, ...patch }

  await memory.updateThread({
    id: sessionId,
    title: thread.title ?? formatSessionTitle(),
    metadata: nextMetadata
  })
}

export async function saveMeetingSummary(
  memory: MemoryStorage,
  sessionId: string,
  summary: string
): Promise<void> {
  await updateThreadMetadata(memory, sessionId, {
    summary,
    summaryStatus: 'ready'
  })
}

export async function markSummaryError(memory: MemoryStorage, sessionId: string): Promise<void> {
  await updateThreadMetadata(memory, sessionId, { summaryStatus: 'error' })
}

const GENERATED_TITLE_MAX_LENGTH = 60

export function normalizeGeneratedTitle(raw: string): string {
  const trimmed = raw.trim().replace(/^["'`]+|["'`]+$/g, '')

  if (!trimmed) {
    throw new Error('Title agent returned empty response.')
  }

  if (trimmed.length <= GENERATED_TITLE_MAX_LENGTH) {
    return trimmed
  }

  return trimmed.slice(0, GENERATED_TITLE_MAX_LENGTH).trimEnd()
}

export async function saveMeetingTitle(
  memory: MemoryStorage,
  sessionId: string,
  title: string
): Promise<void> {
  const thread = await memory.getThreadById({ threadId: sessionId, resourceId: MEETIFY_RESOURCE_ID })

  if (!thread) {
    throw new Error(`Meeting session not found: ${sessionId}`)
  }

  await memory.updateThread({
    id: sessionId,
    title,
    metadata: thread.metadata ?? {}
  })
}

export async function getMeetingTranscriptEntries(
  memory: MemoryStorage,
  sessionId: string
): Promise<SavedTranscriptEntry[]> {
  const session = await loadMeetingSession(memory, sessionId)
  return session?.transcript ?? []
}

export async function deleteMeetingSession(
  memory: MemoryStorage,
  sessionId: string
): Promise<void> {
  const thread = await memory.getThreadById({
    threadId: sessionId,
    resourceId: MEETIFY_RESOURCE_ID
  })

  if (!thread) {
    throw new Error(`Meeting session not found: ${sessionId}`)
  }

  const { messages } = await memory.listMessages({
    threadId: sessionId,
    resourceId: MEETIFY_RESOURCE_ID,
    perPage: false
  })

  if (messages.length > 0) {
    await memory.deleteMessages(messages.map((message) => message.id))
  }

  await memory.deleteThread({ threadId: sessionId })
}
