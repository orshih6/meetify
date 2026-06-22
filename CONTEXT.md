# Meetify domain glossary

## Recording

Live capture, real-time transcription, and transcript file save as one lifecycle. Starts when the user begins recording; ends when capture stops and the transcript JSON is written (or save fails).

## Session catalog

The persisted list of **MeetingSession** entries. Each entry is backed by a transcript JSON file in `userData/transcripts/`. The catalog loads on app start and grows when a Recording completes.

## Session navigation

Which session is selected in the UI, plus back/forward history over prior selections. Selection changes reset detail view state (active tab, ask query).

## Transcript source

An audio channel identifier: `me` (microphone) or `interviewer` (system / loopback audio). Each active source gets its own transcription stream in main.

## MeetingSession

A UI session entry: id, title, startedAt, duration, optional summary and transcript for detail view.
