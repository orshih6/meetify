import { Button, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { panelTitle, surfaceBorder } from '@renderer/lib/uiClasses'
import { cn } from '@renderer/lib/utils'
import { useSessionCatalogStore } from '@renderer/stores/sessionCatalogStore'
import type { MeetingSession } from '@renderer/types/meeting'
import { useState } from 'react'

type DeleteSessionDialogProps = {
  session: MeetingSession
  open: boolean
  onClose: () => void
}

export function DeleteSessionDialog({ session, open, onClose }: DeleteSessionDialogProps) {
  const deleteSession = useSessionCatalogStore((state) => state.deleteSession)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (isDeleting) {
      return
    }

    setError(null)
    onClose()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await deleteSession(session.id)
      setIsDeleting(false)
      onClose()
    } catch (err) {
      setIsDeleting(false)
      setError(err instanceof Error ? err.message : 'Failed to delete meeting.')
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm',
          'transition-opacity data-closed:opacity-0'
        )}
      />

      <div className="fixed inset-0 flex items-center justify-center p-6">
        <DialogPanel
          transition
          className={cn(
            'w-full max-w-md rounded-2xl border bg-neutral-950 p-6',
            surfaceBorder,
            'transition-opacity data-closed:opacity-0'
          )}
        >
          <DialogTitle className={panelTitle}>Delete meeting?</DialogTitle>

          <p className="mt-2 text-xs text-neutral-500">
            This will permanently delete <span className="text-neutral-300">{session.title}</span>.
            This action cannot be undone.
          </p>

          {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className={cn(
                'rounded-lg border border-neutral-800 px-4 py-1.5 text-xs text-neutral-300',
                'transition-colors hover:border-neutral-700 hover:text-white',
                'disabled:cursor-not-allowed disabled:opacity-40'
              )}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className={cn(
                'rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white',
                'transition-colors hover:bg-red-500',
                'disabled:cursor-not-allowed disabled:opacity-40'
              )}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
