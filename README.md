# Meetify

Desktop app to record meetings, transcribe in real time, and generate AI summaries. Local-first — your sessions stay on your machine.

## Features

- Record microphone (+ system audio when permitted)
- Live transcript while recording
- Auto-generated meeting title and markdown summary
- Session history grouped by date
- Copy summary or full transcript
- Retry or regenerate summary if something fails
- Settings for language, microphone, and OpenAI API key
- Keyboard shortcuts: `Cmd+,` settings · `Cmd+R` start · `Cmd+Shift+R` stop

## How to use

1. **Get the app** — install a build (see [Development](#development)) or run from source.
2. **Add your API key** — Settings → AI Providers, or set `OPENAI_API_KEY` in `.env` for local dev.
3. **Allow microphone access** — on macOS, the built app may also need System Audio Recording for meeting audio capture.
4. **Record** — click Start recording, then Stop when the meeting ends.
5. **Review** — open the session from the list; read the Summary and Transcript tabs.
6. **Adjust** — change language or input device under Settings → Audio.

## Tech stack

- **Electron + electron-vite + electron-builder** — cross-platform desktop app
- **React 19 + TypeScript + Tailwind 4** — UI
- **Zustand + Headless UI** — state and accessible components
- **OpenAI Realtime API** — live speech-to-text
- **OpenAI GPT (gpt-5-mini) + Mastra** — title and summary agents
- **LibSQL (Mastra)** — local session storage (`meetify.db` in app data)

## Project layout

```
src/main/      — Electron main process, IPC, transcription
src/renderer/  — React UI
src/preload/   — window.api bridge
src/shared/    — IPC channels and types
src/mastra/    — agents and storage
```

## Development

**Prerequisites:** Node.js 22.x, pnpm, OpenAI API key

```bash
nvm use
pnpm install
cp .env.example .env   # add OPENAI_API_KEY
pnpm dev
```

**Scripts**

- `pnpm dev` — run app with hot reload
- `pnpm build` — typecheck and production build
- `pnpm build:mac` / `build:win` / `build:linux` — platform installers
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript

## Agents

Two Mastra agents in `src/mastra/agents/`:

- **meeting-title-agent** — short descriptive title from the transcript
- **meeting-summary-agent** — markdown summary (overview + key takeaways)

To improve them: edit `instructions` in the agent files, change the model, or register new agents in `src/mastra/index.ts` (see `AGENTS.md`). Possible next steps: Q&A over a session, workflows for long meetings, alternate speech-to-text providers.

## Troubleshooting

### Use Node.js 22

Use **Node.js 22** (tested with v22.23.0). Node 24 can break install and dev — for example `Error: Electron uninstall` or a missing `node_modules/electron/path.txt`.

```bash
# With nvm
nvm install 22.23.0
nvm use 22.23.0

# Reinstall after switching Node versions
rm -rf node_modules
pnpm install

node -v   # should print v22.x.x
pnpm dev
```

### `Error: Electron uninstall` on `pnpm dev`

If this persists on Node 22, Electron's native binary was not downloaded during install. `electron-vite` looks for `node_modules/electron/path.txt`, which is created by Electron's postinstall script.
