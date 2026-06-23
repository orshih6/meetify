import { randomUUID } from 'node:crypto'
import type { MastraDBMessage } from '@mastra/core/agent'
import type { MemoryStorage } from '@mastra/core/storage'
import type {
  SavedTranscriptEntry,
  SessionListEntry,
  SessionLoadResult,
  SessionStatus,
  SummaryStatus
} from '@shared/ipc'
import { MEETIFY_RESOURCE_ID } from './storage'

type MeetingThreadMetadata = {
  startedAt: string
  durationSeconds: number
  sessionStatus?: SessionStatus
  summaryStatus?: SummaryStatus
  summary?: string
}

const UNTITLED_SESSION_TITLE = 'Untitled'

function formatSessionTitle(): string {
  return UNTITLED_SESSION_TITLE
}

function parseThreadMetadata(metadata: Record<string, unknown> | undefined): MeetingThreadMetadata {
  const startedAt =
    typeof metadata?.startedAt === 'string' ? metadata.startedAt : new Date().toISOString()
  const durationSeconds =
    typeof metadata?.durationSeconds === 'number' ? metadata.durationSeconds : 0
  const sessionStatus =
    metadata?.sessionStatus === 'recording' || metadata?.sessionStatus === 'completed'
      ? metadata.sessionStatus
      : undefined
  const summaryStatus =
    metadata?.summaryStatus === 'processing' ||
    metadata?.summaryStatus === 'ready' ||
    metadata?.summaryStatus === 'error'
      ? metadata.summaryStatus
      : undefined
  const summary = typeof metadata?.summary === 'string' ? metadata.summary : undefined

  return { startedAt, durationSeconds, sessionStatus, summaryStatus, summary }
}

function transcriptEntryToMessage(
  entry: SavedTranscriptEntry,
  threadId: string
): MastraDBMessage {
  return {
    id: randomUUID(),
    role: 'user',
    threadId,
    resourceId: MEETIFY_RESOURCE_ID,
    createdAt: new Date(entry.itemStartedAtMs),
    content: {
      format: 2,
      parts: [{ type: 'text', text: entry.text }],
      metadata: {
        speaker: entry.speaker,
        itemId: entry.itemId,
        itemStartedAtMs: entry.itemStartedAtMs
      }
    }
  }
}

function messageToTranscriptEntry(
  message: MastraDBMessage,
  recordingStartedAt: string
): SavedTranscriptEntry {
  const metadata = message.content.metadata ?? {}
  const speaker = typeof metadata.speaker === 'string' ? metadata.speaker : 'Unknown'
  const textPart = message.content.parts.find((part) => part.type === 'text')
  const text = textPart && 'text' in textPart ? textPart.text : ''

  const itemId = typeof metadata.itemId === 'string' ? metadata.itemId : message.id

  if (typeof metadata.itemStartedAtMs === 'number') {
    return { speaker, text, itemId, itemStartedAtMs: metadata.itemStartedAtMs }
  }

  if (typeof metadata.elapsedSeconds === 'number') {
    const recordingStartedAtMs = new Date(recordingStartedAt).getTime()
    return {
      speaker,
      text,
      itemId,
      itemStartedAtMs: recordingStartedAtMs + metadata.elapsedSeconds * 1000
    }
  }

  return {
    speaker,
    text,
    itemId,
    itemStartedAtMs: message.createdAt.getTime()
  }
}

export async function createRecordingSession(
  memory: MemoryStorage,
  startedAt: string
): Promise<string> {
  const sessionId = randomUUID()
  const now = new Date()
  const metadata: MeetingThreadMetadata = {
    startedAt,
    durationSeconds: 0,
    sessionStatus: 'recording'
  }

  await memory.saveThread({
    thread: {
      id: sessionId,
      resourceId: MEETIFY_RESOURCE_ID,
      title: formatSessionTitle(),
      createdAt: now,
      updatedAt: now,
      metadata
    }
  })

  return sessionId
}

export async function appendTranscriptEntry(
  memory: MemoryStorage,
  sessionId: string,
  entry: SavedTranscriptEntry,
  _startedAt: string
): Promise<void> {
  const trimmed = entry.text.trim()

  if (!trimmed) {
    return
  }

  const message = transcriptEntryToMessage({ ...entry, text: trimmed }, sessionId)
  await memory.saveMessages({ messages: [message] })
}

export async function countTranscriptEntries(
  memory: MemoryStorage,
  sessionId: string
): Promise<number> {
  const { messages } = await memory.listMessages({
    threadId: sessionId,
    resourceId: MEETIFY_RESOURCE_ID,
    perPage: false
  })

  return messages.length
}

export async function finalizeRecordingSession(
  memory: MemoryStorage,
  sessionId: string,
  stoppedAt: number
): Promise<{ durationSeconds: number; entryCount: number }> {
  const thread = await memory.getThreadById({
    threadId: sessionId,
    resourceId: MEETIFY_RESOURCE_ID
  })

  if (!thread) {
    throw new Error(`Meeting session not found: ${sessionId}`)
  }

  const meta = parseThreadMetadata(thread.metadata)
  const startedAtMs = new Date(meta.startedAt).getTime()
  const durationSeconds = Math.max(0, Math.floor((stoppedAt - startedAtMs) / 1000))

  await memory.updateThread({
    id: sessionId,
    title: thread.title ?? formatSessionTitle(),
    metadata: {
      ...meta,
      durationSeconds,
      sessionStatus: 'completed',
      summaryStatus: 'processing'
    }
  })

  const entryCount = await countTranscriptEntries(memory, sessionId)

  return { durationSeconds, entryCount }
}

export async function listMeetingSessions(memory: MemoryStorage): Promise<SessionListEntry[]> {
  const { threads } = await memory.listThreads({
    filter: { resourceId: MEETIFY_RESOURCE_ID },
    perPage: false,
    orderBy: { field: 'createdAt', direction: 'DESC' }
  })

  return threads
    .filter((thread) => parseThreadMetadata(thread.metadata).sessionStatus !== 'recording')
    .map((thread) => {
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
  const thread = await memory.getThreadById({
    threadId: sessionId,
    resourceId: MEETIFY_RESOURCE_ID
  })

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
    .map((message) => messageToTranscriptEntry(message, meta.startedAt))
    .toSorted((a, b) => a.itemStartedAtMs - b.itemStartedAtMs)

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
  const thread = await memory.getThreadById({
    threadId: sessionId,
    resourceId: MEETIFY_RESOURCE_ID
  })

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
  const thread = await memory.getThreadById({
    threadId: sessionId,
    resourceId: MEETIFY_RESOURCE_ID
  })

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
    return
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

export async function deleteOrphanRecordingSessions(memory: MemoryStorage): Promise<void> {
  const { threads } = await memory.listThreads({
    filter: { resourceId: MEETIFY_RESOURCE_ID },
    perPage: false
  })

  for (const thread of threads) {
    const meta = parseThreadMetadata(thread.metadata)

    if (meta.sessionStatus === 'recording') {
      await deleteMeetingSession(memory, thread.id)
    }
  }
}
