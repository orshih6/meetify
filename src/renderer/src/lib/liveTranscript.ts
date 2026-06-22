import { formatDuration } from '@renderer/lib/format'
import type { TranscriptSource } from '@renderer/lib/audioStreamCapture'
import type { SavedSessionTranscript, SavedTranscriptEntry } from '@renderer/types/meeting'

export const SOURCE_LABELS: Record<TranscriptSource, string> = {
  me: 'Me',
  interviewer: 'Them'
}

export const TRANSCRIPT_SOURCES = [
  'me',
  'interviewer'
] as const satisfies readonly TranscriptSource[]

export type StoredTranscriptEntry = SavedTranscriptEntry & {
  utteranceStartedAtMs: number
}

export type LiveTranscriptState = {
  entries: StoredTranscriptEntry[]
  partials: Record<TranscriptSource, string>
  utteranceStartedAt: Record<TranscriptSource, number | null>
  lastActivityAt: Record<TranscriptSource, number>
}

export function createLiveTranscriptState(): LiveTranscriptState {
  return {
    entries: [],
    partials: { me: '', interviewer: '' },
    utteranceStartedAt: { me: null, interviewer: null },
    lastActivityAt: { me: 0, interviewer: 0 }
  }
}

function elapsedSecondsFromStart(utteranceStartedAtMs: number, recordingStartedAt: number): number {
  return Math.max(0, Math.floor((utteranceStartedAtMs - recordingStartedAt) / 1000))
}

function finalizePartial(
  state: LiveTranscriptState,
  source: TranscriptSource,
  text: string,
  recordingStartedAt: number
): LiveTranscriptState {
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      ...state,
      partials: { ...state.partials, [source]: '' },
      utteranceStartedAt: { ...state.utteranceStartedAt, [source]: null }
    }
  }

  const utteranceStartedAtMs = state.utteranceStartedAt[source] ?? Date.now()
  const elapsedSeconds = elapsedSecondsFromStart(utteranceStartedAtMs, recordingStartedAt)

  const entry: StoredTranscriptEntry = {
    speaker: SOURCE_LABELS[source],
    time: formatDuration(elapsedSeconds),
    text: trimmed,
    elapsedSeconds,
    utteranceStartedAtMs
  }

  return {
    ...state,
    entries: [...state.entries, entry],
    partials: { ...state.partials, [source]: '' },
    utteranceStartedAt: { ...state.utteranceStartedAt, [source]: null }
  }
}

export function appendDelta(
  state: LiveTranscriptState,
  source: TranscriptSource,
  delta: string
): LiveTranscriptState {
  const now = Date.now()
  const isFirstDelta = state.partials[source].length === 0

  return {
    ...state,
    partials: {
      ...state.partials,
      [source]: state.partials[source] + delta
    },
    utteranceStartedAt: {
      ...state.utteranceStartedAt,
      [source]: isFirstDelta ? now : state.utteranceStartedAt[source]
    },
    lastActivityAt: { ...state.lastActivityAt, [source]: now }
  }
}

export function finalizeUtterance(
  state: LiveTranscriptState,
  source: TranscriptSource,
  text: string | undefined,
  recordingStartedAt: number
): LiveTranscriptState {
  const utteranceText = text ?? state.partials[source]
  return finalizePartial(state, source, utteranceText, recordingStartedAt)
}

export function finalizePartialOnEnd(
  state: LiveTranscriptState,
  source: TranscriptSource,
  recordingStartedAt: number
): LiveTranscriptState {
  return finalizePartial(state, source, state.partials[source], recordingStartedAt)
}

export function getLiveDisplayText(state: LiveTranscriptState): string {
  const finalized = state.entries.map((entry) => entry.text).join(' ')
  const streaming = Object.values(state.partials).filter(Boolean).join(' ')
  return [finalized, streaming].filter(Boolean).join(' ')
}

export function getStoredTranscriptEntries(state: LiveTranscriptState): SavedTranscriptEntry[] {
  return state.entries
    .toSorted((a, b) => a.elapsedSeconds - b.elapsedSeconds)
    .map(({ speaker, time, text, elapsedSeconds }) => ({ speaker, time, text, elapsedSeconds }))
}

export function buildSavedSessionTranscript(
  state: LiveTranscriptState,
  recordingStartedAt: number,
  stoppedAt: number
): SavedSessionTranscript {
  return {
    startedAt: new Date(recordingStartedAt).toISOString(),
    durationSeconds: Math.max(0, Math.floor((stoppedAt - recordingStartedAt) / 1000)),
    transcript: getStoredTranscriptEntries(state)
  }
}

export function makeTranscriptFilename(startedAt: number): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  const date = new Date(startedAt)

  return `transcript-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.json`
}
