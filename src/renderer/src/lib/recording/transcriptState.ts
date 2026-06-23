import { buildTranscriptEntry, SOURCE_LABELS } from '@shared/transcript'
import type { SavedTranscriptEntry, TranscriptSource } from '@shared/ipc'

export { SOURCE_LABELS }

export const TRANSCRIPT_SOURCES = [
  'me',
  'interviewer'
] as const satisfies readonly TranscriptSource[]

export type LiveTranscriptState = {
  entries: SavedTranscriptEntry[]
  partials: Record<string, string>
  itemSource: Record<string, TranscriptSource>
  itemStartedAtMs: Record<string, number>
}

export function createLiveTranscriptState(): LiveTranscriptState {
  return {
    entries: [],
    partials: {},
    itemSource: {},
    itemStartedAtMs: {}
  }
}

export function appendDelta(
  state: LiveTranscriptState,
  source: TranscriptSource,
  itemId: string,
  delta: string,
  itemStartedAtMs?: number
): LiveTranscriptState {
  const nextItemStartedAtMs = { ...state.itemStartedAtMs }

  if (itemStartedAtMs !== undefined && nextItemStartedAtMs[itemId] === undefined) {
    nextItemStartedAtMs[itemId] = itemStartedAtMs
  }

  return {
    ...state,
    partials: {
      ...state.partials,
      [itemId]: (state.partials[itemId] ?? '') + delta
    },
    itemSource: { ...state.itemSource, [itemId]: source },
    itemStartedAtMs: nextItemStartedAtMs
  }
}

export function finalizeUtterance(
  state: LiveTranscriptState,
  source: TranscriptSource,
  itemId: string,
  text: string,
  itemStartedAtMs: number
): LiveTranscriptState {
  const trimmed = text.trim()
  const nextPartials = { ...state.partials }
  delete nextPartials[itemId]

  const nextItemSource = { ...state.itemSource }
  delete nextItemSource[itemId]

  const nextItemStartedAtMs = { ...state.itemStartedAtMs }
  delete nextItemStartedAtMs[itemId]

  if (!trimmed) {
    return {
      entries: state.entries,
      partials: nextPartials,
      itemSource: nextItemSource,
      itemStartedAtMs: nextItemStartedAtMs
    }
  }

  const entry = buildTranscriptEntry({ source, text: trimmed, itemId, itemStartedAtMs })

  return {
    entries: [...state.entries, entry],
    partials: nextPartials,
    itemSource: nextItemSource,
    itemStartedAtMs: nextItemStartedAtMs
  }
}

export function getLiveDisplayTextBySource(
  state: LiveTranscriptState,
  source: TranscriptSource
): string {
  const speaker = SOURCE_LABELS[source]

  const finalized = state.entries
    .filter((entry) => entry.speaker === speaker)
    .toSorted((a, b) => a.itemStartedAtMs - b.itemStartedAtMs)
    .map((entry) => entry.text)
    .join(' ')

  const streaming = Object.entries(state.partials)
    .filter(([itemId]) => state.itemSource[itemId] === source)
    .toSorted(
      ([itemIdA], [itemIdB]) =>
        (state.itemStartedAtMs[itemIdA] ?? 0) - (state.itemStartedAtMs[itemIdB] ?? 0)
    )
    .map(([, text]) => text)
    .join(' ')

  return [finalized, streaming].filter(Boolean).join(' ')
}

export function getPendingPartialEntries(state: LiveTranscriptState): SavedTranscriptEntry[] {
  const entries: SavedTranscriptEntry[] = []

  for (const [itemId, text] of Object.entries(state.partials)) {
    const trimmed = text.trim()

    if (!trimmed) {
      continue
    }

    const source = state.itemSource[itemId]

    if (!source) {
      continue
    }

    const itemStartedAtMs = state.itemStartedAtMs[itemId] ?? Date.now()

    entries.push(buildTranscriptEntry({ source, text: trimmed, itemId, itemStartedAtMs }))
  }

  return entries
}
