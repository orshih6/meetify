import { cn } from '@renderer/lib/utils'
import type { ComponentType, ReactNode, SVGProps } from 'react'

type EmptyStateProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center py-10 text-center', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
        <Icon className="text-signal h-5 w-5" aria-hidden="true" />
      </div>
      <p className="font-display text-ink mt-4 text-base">{title}</p>
      <p className="text-ash mt-1 max-w-xs text-sm">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
