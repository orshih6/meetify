# Meetify domain vocabulary

Terms surfaced by the recording and transcript refactor.

## Meeting session

A recorded conversation persisted as a Mastra thread. Holds metadata (title, start time, duration, summary status) and a transcript of utterances.

## Transcript source

The audio channel an utterance came from: `me` (microphone) or `interviewer` (system/loopback audio). Display labels ("Me", "Them") are derived at render time via `SOURCE_LABELS`.

## Live transcript state

Renderer in-memory state during an active recording. Tracks finalized lines plus in-flight partial text per `itemId` for live UI. Not persisted directly — main process owns writes.

## Transcript entry

A single persisted utterance line with `itemId`, `itemStartedAtMs`, `speaker` (display label), and `text`. Stored as Mastra thread messages with metadata.

## Recording pipeline

Renderer module (`recordingPipeline.ts`) that orchestrates audio capture, IPC to main-process transcription, and live transcript state updates. On stop, delegates persistence to main via `transcription.stop`.

## Write authority

Main process (`transcription.ts` + `meetingRepository.ts`) is the single authority for persisting transcript entries. Renderer holds display state only.

## itemId dedup

`appendTranscriptEntry` skips writes when a message with the same `itemId` already exists, guarding races between partial flush and completed utterance at stop.
