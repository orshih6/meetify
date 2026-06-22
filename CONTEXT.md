# Meetify domain glossary

## Recording

Live capture, real-time transcription, and session persistence as one lifecycle. Starts when the user begins recording; ends when capture stops and the transcript is saved to the Session catalog via IPC (`session:save`). Summary generation runs asynchronously after save.

## Session catalog

The persisted list of **MeetingSession** entries. Each entry is a Mastra memory thread in LibSQL (`meetify.db` under Electron `userData`), with transcript utterances stored as messages and summary metadata on the thread. The catalog loads on app start (`session:list`) and grows when a Recording completes.

## Session navigation

Which session is selected in the UI, plus back/forward history over prior selections. Selection changes reset detail view state (active tab).

## Transcript source

An audio channel identifier: `me` (microphone) or `interviewer` (system / loopback audio). Each active source gets its own transcription stream in main.

## MeetingSession

A UI session entry: id (thread id), title, startedAt, duration, optional summary, summaryStatus, and transcript for detail view.

## Credentials

OpenAI API key storage. Saved keys are encrypted with OS-backed `safeStorage` in main; the renderer only sets or clears the key via IPC and reads status (never the full secret). Dev fallback: `OPENAI_API_KEY` in `.env`.
