import type { TranscriptEntry as TranscriptEntryType } from '@renderer/types/meeting'

type TranscriptEntryProps = {
  entry: TranscriptEntryType
}

export function TranscriptEntry({ entry }: TranscriptEntryProps): React.JSX.Element {
  return (
    <div>
      <div className="text-sm text-neutral-500">
        <span>{entry.speaker}</span>
        <span className="ml-2 font-mono text-neutral-600">{entry.time}</span>
      </div>
      <p className="mt-1 text-base text-white">{entry.text}</p>
    </div>
  )
}
