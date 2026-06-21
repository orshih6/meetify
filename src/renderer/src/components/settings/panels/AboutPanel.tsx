export function AboutPanel() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">About</h2>
      <p className="mt-1 text-sm text-neutral-500">Meetify meeting notes application.</p>

      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <p className="text-sm text-neutral-300">Meetify</p>
        <p className="mt-1 text-sm text-neutral-500">Version 1.0.0</p>
        <p className="mt-4 text-sm text-neutral-500">
          Capture, transcribe, and summarize your meetings in one place.
        </p>
      </div>
    </div>
  )
}
